const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createReservation,
  getUserReservations,
  cancelReservation,
  getReservationPdf,
} = require("../controllers/reservationController");

router.post("/", authMiddleware, createReservation);
router.get("/my", authMiddleware, getUserReservations);
router.get("/:id/pdf", authMiddleware, getReservationPdf);
router.patch("/:id/cancel", authMiddleware, cancelReservation);

module.exports = router;
