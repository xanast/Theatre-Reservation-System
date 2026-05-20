const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { verifyTicket } = require("../controllers/staffController");

const staffOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Δεν έχεις δικαίωμα πρόσβασης στον έλεγχο εισιτηρίων.",
    });
  }

  next();
};

router.get("/verify/:reservationId", authMiddleware, staffOnly, verifyTicket);

module.exports = router;
