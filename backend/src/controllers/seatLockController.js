const pool = require("../db");

const LOCK_MINUTES = 2;

const lockSeat = async (req, res) => {
  try {
    const { seatId } = req.body;

    if (!seatId) {
      return res.status(400).json({
        success: false,
        message: "seatId required",
      });
    }

    const seats = await pool.query(
      `
      SELECT *
      FROM seats
      WHERE seat_id = ?
      `,
      [seatId]
    );

    if (seats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    const seat = seats[0];

    if (seat.is_reserved) {
      return res.status(400).json({
        success: false,
        message: "Η θέση είναι ήδη κρατημένη.",
      });
    }

    const now = new Date();

    if (
      seat.locked_until &&
      new Date(seat.locked_until) > now &&
      seat.locked_by_user_id !== req.user.userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Η θέση είναι προσωρινά δεσμευμένη.",
      });
    }

    const lockedUntil = new Date(
      now.getTime() + LOCK_MINUTES * 60 * 1000
    );

    await pool.query(
      `
      UPDATE seats
      SET locked_by_user_id = ?,
          locked_until = ?
      WHERE seat_id = ?
      `,
      [req.user.userId, lockedUntil, seatId]
    );

    return res.json({
      success: true,
      message: "Η θέση δεσμεύτηκε προσωρινά.",
      lockedUntil,
    });
  } catch (error) {
    console.error("Lock seat error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const unlockSeat = async (req, res) => {
  try {
    const { seatId } = req.body;

    await pool.query(
      `
      UPDATE seats
      SET locked_by_user_id = NULL,
          locked_until = NULL
      WHERE seat_id = ?
      AND locked_by_user_id = ?
      `,
      [seatId, req.user.userId]
    );

    return res.json({
      success: true,
      message: "Η θέση αποδεσμεύτηκε.",
    });
  } catch (error) {
    console.error("Unlock seat error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  lockSeat,
  unlockSeat,
};