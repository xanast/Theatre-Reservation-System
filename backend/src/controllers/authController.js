const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Όνομα, email και κωδικός είναι υποχρεωτικά.",
      });
    }

    const existingUsers = await pool.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Υπάρχει ήδη χρήστης με αυτό το email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'USER')
      `,
      [name, email, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Ο χρήστης δημιουργήθηκε με επιτυχία.",
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά την εγγραφή.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email και κωδικός είναι υποχρεωτικά.",
      });
    }

    const users = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Λάθος email ή κωδικός.",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Λάθος email ή κωδικός.",
      });
    }

    const role = user.role || "USER";

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      message: "Επιτυχής σύνδεση.",
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Σφάλμα server κατά τη σύνδεση.",
    });
  }
};

module.exports = {
  register,
  login,
};
