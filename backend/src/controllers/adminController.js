const pool = require("../db");

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";

  const stringValue = String(value).replace(/"/g, '""');

  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue}"`;
  }

  return stringValue;
};

const formatDateForCsv = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("el-GR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getDashboardStats = async (req, res) => {
  try {
    const reservationStats = await pool.query(
      `
      SELECT
        COUNT(*) AS total_reservations,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_reservations,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_reservations,
        COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN total_price ELSE 0 END), 0) AS active_revenue
      FROM reservations
      `
    );

    const seatStats = await pool.query(
      `
      SELECT
        COUNT(*) AS total_seats,
        SUM(CASE WHEN is_reserved = true THEN 1 ELSE 0 END) AS reserved_seats,
        SUM(CASE WHEN is_reserved = false THEN 1 ELSE 0 END) AS available_seats
      FROM seats
      `
    );

    const showStats = await pool.query(
      `
      SELECT
        COUNT(DISTINCT theatres.theatre_id) AS total_theatres,
        COUNT(DISTINCT shows.show_id) AS total_shows,
        COUNT(DISTINCT showtimes.showtime_id) AS total_showtimes
      FROM theatres
      LEFT JOIN shows ON theatres.theatre_id = shows.theatre_id
      LEFT JOIN showtimes ON shows.show_id = showtimes.show_id
      `
    );

    const popularShows = await pool.query(
      `
      SELECT
        shows.title,
        theatres.name AS theatre_name,
        COUNT(reservations.reservation_id) AS reservations_count,
        COALESCE(
          SUM(CASE WHEN reservations.status = 'ACTIVE' THEN reservations.total_price ELSE 0 END),
          0
        ) AS revenue
      FROM reservations
      INNER JOIN showtimes ON reservations.showtime_id = showtimes.showtime_id
      INNER JOIN shows ON showtimes.show_id = shows.show_id
      INNER JOIN theatres ON shows.theatre_id = theatres.theatre_id
      GROUP BY shows.show_id, shows.title, theatres.name
      ORDER BY reservations_count DESC
      LIMIT 5
      `
    );

    return res.json({
      success: true,
      stats: {
        total_reservations: Number(reservationStats[0].total_reservations || 0),
        active_reservations: Number(reservationStats[0].active_reservations || 0),
        cancelled_reservations: Number(reservationStats[0].cancelled_reservations || 0),
        active_revenue: Number(reservationStats[0].active_revenue || 0),
        total_seats: Number(seatStats[0].total_seats || 0),
        reserved_seats: Number(seatStats[0].reserved_seats || 0),
        available_seats: Number(seatStats[0].available_seats || 0),
        total_theatres: Number(showStats[0].total_theatres || 0),
        total_shows: Number(showStats[0].total_shows || 0),
        total_showtimes: Number(showStats[0].total_showtimes || 0),
        popular_shows: popularShows.map((show) => ({
          title: show.title,
          theatre_name: show.theatre_name,
          reservations_count: Number(show.reservations_count || 0),
          revenue: Number(show.revenue || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τη φόρτωση στατιστικών.",
    });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const reservations = await pool.query(
      `
      SELECT
        r.reservation_id,
        r.status,
        r.total_price,
        r.created_at,
        u.user_id,
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
      INNER JOIN users u
        ON r.user_id = u.user_id
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
      GROUP BY
        r.reservation_id,
        r.status,
        r.total_price,
        r.created_at,
        u.user_id,
        u.name,
        u.email,
        st.start_time,
        st.hall_name,
        s.title,
        t.name,
        t.location
      ORDER BY r.created_at DESC
      `
    );

    return res.json({
      success: true,
      reservations: reservations.map((reservation) => ({
        ...reservation,
        reservation_id: Number(reservation.reservation_id),
        user_id: Number(reservation.user_id),
        total_price: Number(reservation.total_price || 0),
      })),
    });
  } catch (error) {
    console.error("Get all reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τη φόρτωση όλων των κρατήσεων.",
    });
  }
};

const exportReservationsCsv = async (req, res) => {
  try {
    const reservations = await pool.query(
      `
      SELECT
        r.reservation_id,
        r.status,
        r.total_price,
        r.created_at,
        u.user_id,
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
      INNER JOIN users u
        ON r.user_id = u.user_id
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
      GROUP BY
        r.reservation_id,
        r.status,
        r.total_price,
        r.created_at,
        u.user_id,
        u.name,
        u.email,
        st.start_time,
        st.hall_name,
        s.title,
        t.name,
        t.location
      ORDER BY r.created_at DESC
      `
    );

    const headers = [
      "reservation_id",
      "status",
      "total_price",
      "created_at",
      "user_id",
      "user_name",
      "user_email",
      "show_title",
      "theatre_name",
      "theatre_location",
      "start_time",
      "hall_name",
      "seats",
    ];

    const rows = reservations.map((reservation) => [
      reservation.reservation_id,
      reservation.status,
      Number(reservation.total_price || 0).toFixed(2),
      formatDateForCsv(reservation.created_at),
      reservation.user_id,
      reservation.user_name,
      reservation.user_email,
      reservation.show_title,
      reservation.theatre_name,
      reservation.theatre_location,
      formatDateForCsv(reservation.start_time),
      reservation.hall_name,
      reservation.seats || "",
    ]);

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const fileName = `reservations-export-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    return res.send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("Export reservations CSV error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά το export των κρατήσεων.",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllReservations,
  exportReservationsCsv,
};
