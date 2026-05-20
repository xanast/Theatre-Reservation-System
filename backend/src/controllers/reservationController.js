const fs = require("fs");
const pool = require("../db");
const PDFDocument = require("pdfkit");
const { sendReservationEmail } = require("../services/emailService");

const findPdfFont = () => {
  const possibleFonts = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/ARIAL.TTF",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/CALIBRI.TTF",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ];

  for (const fontPath of possibleFonts) {
    if (fs.existsSync(fontPath)) return fontPath;
  }

  return null;
};

const formatGreekDate = (value) => {
  const date = new Date(value);

  return date.toLocaleString("el-GR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTicketDetails = async (reservationId, userId) => {
  const rows = await pool.query(
    `
    SELECT
      r.reservation_id,
      r.status,
      r.total_price,
      r.created_at,
      u.name AS user_name,
      u.email AS user_email,
      st.start_time,
      st.hall_name,
      s.title AS show_title,
      t.name AS theatre_name,
      t.location AS theatre_location,
      GROUP_CONCAT(
        CONCAT(se.seat_row, se.seat_number)
        ORDER BY se.seat_row ASC, se.seat_number ASC
        SEPARATOR ', '
      ) AS seats
    FROM reservations r
    INNER JOIN users u ON r.user_id = u.user_id
    INNER JOIN showtimes st ON r.showtime_id = st.showtime_id
    INNER JOIN shows s ON st.show_id = s.show_id
    INNER JOIN theatres t ON s.theatre_id = t.theatre_id
    LEFT JOIN reservation_seats rs ON r.reservation_id = rs.reservation_id
    LEFT JOIN seats se ON rs.seat_id = se.seat_id
    WHERE r.reservation_id = ? AND r.user_id = ?
    GROUP BY
      r.reservation_id,
      r.status,
      r.total_price,
      r.created_at,
      u.name,
      u.email,
      st.start_time,
      st.hall_name,
      s.title,
      t.name,
      t.location
    `,
    [reservationId, userId]
  );

  if (rows.length === 0) return null;

  return {
    ...rows[0],
    start_time_formatted: formatGreekDate(rows[0].start_time),
  };
};

const createReservation = async (req, res) => {
  let conn;

  try {
    const { showtimeId, seatIds } = req.body;

    if (!showtimeId || !seatIds || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "showtimeId και seatIds είναι υποχρεωτικά.",
      });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const seats = await conn.query(
      `
      SELECT *
      FROM seats
      WHERE seat_id IN (${seatIds.map(() => "?").join(",")})
      `,
      seatIds
    );

    if (seats.length !== seatIds.length) {
      await conn.rollback();

      return res.status(404).json({
        success: false,
        message: "Κάποιες θέσεις δεν βρέθηκαν.",
      });
    }

    const invalidShowtimeSeat = seats.find(
      (seat) => Number(seat.showtime_id) !== Number(showtimeId)
    );

    if (invalidShowtimeSeat) {
      await conn.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Οι επιλεγμένες θέσεις δεν ανήκουν στη συγκεκριμένη ώρα παράστασης.",
      });
    }

    const alreadyReserved = seats.find((seat) => seat.is_reserved);

    if (alreadyReserved) {
      await conn.rollback();

      return res.status(400).json({
        success: false,
        message: "Μία ή περισσότερες θέσεις έχουν ήδη κρατηθεί.",
      });
    }

    const now = new Date();

    const lockedByOtherUser = seats.find((seat) => {
      if (!seat.locked_until || !seat.locked_by_user_id) return false;

      return (
        new Date(seat.locked_until) > now &&
        Number(seat.locked_by_user_id) !== Number(req.user.userId)
      );
    });

    if (lockedByOtherUser) {
      await conn.rollback();

      return res.status(400).json({
        success: false,
        message: "Μία ή περισσότερες θέσεις είναι προσωρινά δεσμευμένες.",
      });
    }

    const totalPrice = seats.reduce(
      (sum, seat) => sum + Number(seat.price),
      0
    );

    const reservationResult = await conn.query(
      `
      INSERT INTO reservations
      (user_id, showtime_id, total_price)
      VALUES (?, ?, ?)
      `,
      [req.user.userId, showtimeId, totalPrice]
    );

    const reservationId = Number(reservationResult.insertId);

    for (const seatId of seatIds) {
      await conn.query(
        `
        INSERT INTO reservation_seats
        (reservation_id, seat_id)
        VALUES (?, ?)
        `,
        [reservationId, seatId]
      );

      await conn.query(
        `
        UPDATE seats
        SET is_reserved = true,
            locked_by_user_id = NULL,
            locked_until = NULL
        WHERE seat_id = ?
        `,
        [seatId]
      );
    }

    await conn.commit();

    const ticketDetails = await getTicketDetails(reservationId, req.user.userId);
    const emailSent = ticketDetails
      ? await sendReservationEmail(ticketDetails)
      : false;

    return res.status(201).json({
      success: true,
      message: "Η κράτηση ολοκληρώθηκε με επιτυχία.",
      reservationId,
      totalPrice: Number(totalPrice),
      emailSent,
    });
  } catch (error) {
    console.error("Create reservation error:", error);

    if (conn) await conn.rollback();

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τη δημιουργία κράτησης.",
    });
  } finally {
    if (conn) conn.release();
  }
};

const getUserReservations = async (req, res) => {
  try {
    const reservations = await pool.query(
      `
      SELECT
        r.reservation_id,
        r.status,
        r.total_price,
        r.created_at,
        st.start_time,
        st.hall_name,
        s.title AS show_title,
        t.name AS theatre_name,
        t.location AS theatre_location,
        GROUP_CONCAT(
          CONCAT(se.seat_row, se.seat_number)
          ORDER BY se.seat_row ASC, se.seat_number ASC
          SEPARATOR ', '
        ) AS seats
      FROM reservations r
      INNER JOIN showtimes st
        ON r.showtime_id = st.showtime_id
      INNER JOIN shows s
        ON st.show_id = s.show_id
      INNER JOIN theatres t
        ON s.theatre_id = t.theatre_id
      LEFT JOIN reservation_seats rs
        ON r.reservation_id = rs.reservation_id
      LEFT JOIN seats se
        ON rs.seat_id = se.seat_id
      WHERE r.user_id = ?
      GROUP BY
        r.reservation_id,
        r.status,
        r.total_price,
        r.created_at,
        st.start_time,
        st.hall_name,
        s.title,
        t.name,
        t.location
      ORDER BY r.created_at DESC
      `,
      [req.user.userId]
    );

    return res.json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error("Get user reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τη φόρτωση κρατήσεων.",
    });
  }
};

const cancelReservation = async (req, res) => {
  let conn;

  try {
    const { id } = req.params;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const reservations = await conn.query(
      `
      SELECT reservation_id, user_id, status
      FROM reservations
      WHERE reservation_id = ? AND user_id = ?
      `,
      [id, req.user.userId]
    );

    if (reservations.length === 0) {
      await conn.rollback();

      return res.status(404).json({
        success: false,
        message: "Η κράτηση δεν βρέθηκε.",
      });
    }

    const reservation = reservations[0];

    if (reservation.status === "CANCELLED") {
      await conn.rollback();

      return res.status(400).json({
        success: false,
        message: "Η κράτηση έχει ήδη ακυρωθεί.",
      });
    }

    const reservedSeats = await conn.query(
      `
      SELECT seat_id
      FROM reservation_seats
      WHERE reservation_id = ?
      `,
      [id]
    );

    for (const seat of reservedSeats) {
      await conn.query(
        `
        UPDATE seats
        SET is_reserved = false,
            locked_by_user_id = NULL,
            locked_until = NULL
        WHERE seat_id = ?
        `,
        [seat.seat_id]
      );
    }

    await conn.query(
      `
      UPDATE reservations
      SET status = 'CANCELLED'
      WHERE reservation_id = ?
      `,
      [id]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: "Η κράτηση ακυρώθηκε με επιτυχία.",
      reservationId: Number(id),
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);

    if (conn) await conn.rollback();

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά την ακύρωση κράτησης.",
    });
  } finally {
    if (conn) conn.release();
  }
};

const getReservationPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await getTicketDetails(id, req.user.userId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Η κράτηση δεν βρέθηκε.",
      });
    }

    const fontPath = findPdfFont();
    const fileName = `ticket-${ticket.reservation_id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Εισιτήριο ${ticket.reservation_id}`,
        Author: "Theatre Reservation System",
        Subject: "Ψηφιακό Εισιτήριο",
      },
    });

    doc.pipe(res);

    if (fontPath) {
      doc.registerFont("AppFont", fontPath);
      doc.registerFont("AppFontBold", fontPath);
      doc.font("AppFont");
    }

    const regularFont = fontPath ? "AppFont" : "Helvetica";
    const boldFont = fontPath ? "AppFontBold" : "Helvetica-Bold";

    doc.rect(0, 0, 595.28, 841.89).fill("#f8fafc");
    doc.rect(0, 0, 595.28, 125).fill("#111827");

    doc
      .fillColor("#ffffff")
      .font(boldFont)
      .fontSize(24)
      .text("Theatre Reservation System", 50, 36);

    doc
      .fillColor("#c4b5fd")
      .font(boldFont)
      .fontSize(15)
      .text("Ψηφιακό Εισιτήριο", 50, 72);

    doc.roundedRect(410, 36, 135, 44, 14).fill("#7c3aed");

    doc
      .fillColor("#ffffff")
      .font(boldFont)
      .fontSize(13)
      .text(`Κωδικός #${ticket.reservation_id}`, 430, 51);

    doc.roundedRect(50, 155, 495, 430, 22).fill("#ffffff").stroke("#e5e7eb");

    doc
      .fillColor("#111827")
      .font(boldFont)
      .fontSize(25)
      .text(ticket.show_title, 80, 190, { width: 400 });

    doc
      .fillColor("#475569")
      .font(regularFont)
      .fontSize(13)
      .text(`${ticket.theatre_name} • ${ticket.theatre_location}`, 80, 225);

    doc
      .moveTo(80, 262)
      .lineTo(515, 262)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();

    const details = [
      ["Πελάτης", ticket.user_name],
      ["Email", ticket.user_email],
      ["Ημερομηνία / Ώρα", ticket.start_time_formatted],
      ["Αίθουσα", ticket.hall_name],
      ["Θέσεις", ticket.seats || "-"],
      ["Κατάσταση", ticket.status],
    ];

    let y = 295;

    details.forEach(([label, value]) => {
      doc
        .fillColor("#64748b")
        .font(boldFont)
        .fontSize(10)
        .text(label, 80, y, { width: 150 });

      doc
        .fillColor("#111827")
        .font(boldFont)
        .fontSize(12)
        .text(value, 245, y, { width: 260 });

      y += 39;
    });

    doc.roundedRect(80, 520, 435, 48, 14).fill("#7c3aed");

    doc
      .fillColor("#ffffff")
      .font(boldFont)
      .fontSize(15)
      .text("Σύνολο", 105, 535);

    doc
      .fillColor("#ffffff")
      .font(boldFont)
      .fontSize(18)
      .text(`€${Number(ticket.total_price).toFixed(2)}`, 390, 532, {
        width: 110,
        align: "right",
      });

    doc.roundedRect(50, 615, 495, 112, 20).fill("#ede9fe").stroke("#ddd6fe");

    doc
      .fillColor("#5b21b6")
      .font(boldFont)
      .fontSize(16)
      .text("Επαλήθευση Εισιτηρίου", 80, 642);

    doc
      .fillColor("#4c1d95")
      .font(boldFont)
      .fontSize(12)
      .text(`TRS-${ticket.reservation_id}-${ticket.status}`, 80, 672);

    doc
      .fillColor("#475569")
      .font(regularFont)
      .fontSize(10)
      .text(
        "Το παρόν PDF αποτελεί ψηφιακό εισιτήριο και συνδέεται με την κράτηση που είναι αποθηκευμένη στη βάση δεδομένων του συστήματος.",
        80,
        696,
        { width: 430, lineGap: 3 }
      );

    doc
      .fillColor("#64748b")
      .font(regularFont)
      .fontSize(9)
      .text("Εμφάνισε αυτό το εισιτήριο στην είσοδο του θεάτρου.", 50, 765, {
        align: "center",
        width: 495,
      });

    doc
      .fillColor("#94a3b8")
      .font(regularFont)
      .fontSize(8)
      .text("Generated by Theatre Reservation System", 50, 790, {
        align: "center",
        width: 495,
      });

    doc.end();
  } catch (error) {
    console.error("Get reservation PDF error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τη δημιουργία PDF εισιτηρίου.",
    });
  }
};

module.exports = {
  createReservation,
  getUserReservations,
  cancelReservation,
  getReservationPdf,
};
