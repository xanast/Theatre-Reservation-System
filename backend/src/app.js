const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const showRoutes = require("./routes/showRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const seatRoutes = require("./routes/seatRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const seatLockRoutes = require("./routes/seatLockRoutes");
const staffRoutes = require("./routes/staffRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seats", seatLockRoutes);
app.use("/api/staff", staffRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Theatre Reservation API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/shows", showRoutes);

module.exports = app;