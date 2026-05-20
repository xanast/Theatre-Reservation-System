const express = require("express");
const router = express.Router();

const { getShowtimes } = require("../controllers/showtimeController");

router.get("/", getShowtimes);

module.exports = router;