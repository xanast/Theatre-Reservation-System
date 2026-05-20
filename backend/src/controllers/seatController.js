const pool = require("../db");

const getSeatsByShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.query;

    if (!showtimeId) {
      return res.status(400).json({
        success: false,
        message: "showtimeId is required",
      });
    }

    const seats = await pool.query(
      `
      SELECT
        seat_id,
        showtime_id,
        seat_row,
        seat_number,
        category,
        price,
        is_reserved
      FROM seats
      WHERE showtime_id = ?
      ORDER BY seat_row ASC, seat_number ASC
      `,
      [showtimeId]
    );

    res.json({
      success: true,
      seats,
    });
  } catch (error) {
    console.error("Get seats error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getSeatsByShowtime,
};