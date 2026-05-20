const express = require("express");
const router = express.Router();

const { getSeatsByShowtime } = require("../controllers/seatController");

router.get("/", getSeatsByShowtime);

module.exports = router;