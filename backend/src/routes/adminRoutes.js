const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getAllReservations,
  exportReservationsCsv,
} = require("../controllers/adminController");

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Δεν έχεις δικαίωμα πρόσβασης στο Admin Panel.",
    });
  }

  next();
};

router.get("/stats", authMiddleware, adminOnly, getDashboardStats);
router.get("/reservations", authMiddleware, adminOnly, getAllReservations);
router.get("/reservations/export", authMiddleware, adminOnly, exportReservationsCsv);

module.exports = router;
