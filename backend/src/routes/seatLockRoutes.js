const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  lockSeat,
  unlockSeat,
} = require("../controllers/seatLockController");

router.post("/lock", authMiddleware, lockSeat);
router.post("/unlock", authMiddleware, unlockSeat);

module.exports = router;