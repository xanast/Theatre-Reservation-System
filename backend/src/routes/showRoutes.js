const express = require("express");
const router = express.Router();

const { getShows, getShowById } = require("../controllers/showController");

router.get("/", getShows);
router.get("/:id", getShowById);

module.exports = router;