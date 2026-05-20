const pool = require("../db");

const verifyTicket = async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "Ο κωδικός κράτησης είναι υποχρεωτικός.",
      });
    }

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
      WHERE r.reservation_id = ?
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
      [reservationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        status: "NOT_FOUND",
        message: "Δεν βρέθηκε εισιτήριο με αυτόν τον κωδικό.",
      });
    }

    const ticket = rows[0];

    if (ticket.status === "CANCELLED") {
      return res.json({
        success: true,
        valid: false,
        status: "CANCELLED",
        message: "Το εισιτήριο έχει ακυρωθεί και δεν είναι έγκυρο.",
        ticket,
      });
    }

    return res.json({
      success: true,
      valid: true,
      status: "VALID",
      message: "Το εισιτήριο είναι έγκυρο.",
      ticket,
    });
  } catch (error) {
    console.error("Verify ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τον έλεγχο εισιτηρίου.",
    });
  }
};

module.exports = {
  verifyTicket,
};
