const pool = require("../db");

const getShowtimes = async (req, res) => {
  try {
    const { showId } = req.query;

    let sql = `
      SELECT
        showtimes.showtime_id,
        showtimes.show_id,
        showtimes.start_time,
        showtimes.hall_name,
        shows.title
      FROM showtimes
      INNER JOIN shows ON showtimes.show_id = shows.show_id
      WHERE 1 = 1
    `;

    const params = [];

    if (showId) {
      sql += " AND showtimes.show_id = ?";
      params.push(showId);
    }

    sql += " ORDER BY showtimes.start_time ASC";

    const showtimes = await pool.query(sql, params);

    res.json({
      success: true,
      showtimes,
    });
  } catch (error) {
    console.error("Get showtimes error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getShowtimes,
};