const pool = require("../db");

const getShows = async (req, res) => {
  try {
    const { theatreId, title, location } = req.query;

    let sql = `
      SELECT 
        shows.show_id,
        shows.theatre_id,
        shows.title,
        shows.description,
        shows.duration_minutes,
        shows.age_rating,
        shows.base_price,
        theatres.name AS theatre_name,
        theatres.location AS theatre_location
      FROM shows
      INNER JOIN theatres ON shows.theatre_id = theatres.theatre_id
      WHERE 1 = 1
    `;

    const params = [];

    if (theatreId) {
      sql += " AND shows.theatre_id = ?";
      params.push(theatreId);
    }

    if (title) {
      sql += " AND shows.title LIKE ?";
      params.push(`%${title}%`);
    }

    if (location) {
      sql += " AND theatres.location LIKE ?";
      params.push(`%${location}%`);
    }

    sql += " ORDER BY shows.title ASC";

    const shows = await pool.query(sql, params);

    res.json({
      success: true,
      shows,
    });
  } catch (error) {
    console.error("Get shows error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getShowById = async (req, res) => {
  try {
    const { id } = req.params;

    const shows = await pool.query(
      `
      SELECT 
        shows.show_id,
        shows.theatre_id,
        shows.title,
        shows.description,
        shows.duration_minutes,
        shows.age_rating,
        shows.base_price,
        theatres.name AS theatre_name,
        theatres.location AS theatre_location,
        theatres.description AS theatre_description
      FROM shows
      INNER JOIN theatres ON shows.theatre_id = theatres.theatre_id
      WHERE shows.show_id = ?
      `,
      [id]
    );

    if (shows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    res.json({
      success: true,
      show: shows[0],
    });
  } catch (error) {
    console.error("Get show by id error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getShows,
  getShowById,
};