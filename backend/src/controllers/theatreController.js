const pool = require("../db");

const getTheatres = async (req, res) => {
  try {
    const theatres = await pool.query(
      "SELECT * FROM theatres ORDER BY name ASC"
    );

    return res.json({
      success: true,
      theatres,
    });
  } catch (error) {
    console.error("Get theatres error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getTheatres,
};