const nodemailer = require("nodemailer");

const isEmailEnabled = () => {
  return (
    process.env.MAIL_ENABLED === "true" &&
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendReservationEmail = async (ticket) => {
  try {
    if (!isEmailEnabled()) {
      console.log("Email disabled or SMTP settings missing. Skipping email.");
      return false;
    }

    const transporter = createTransporter();

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
        <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:18px; padding:26px; border:1px solid #e5e7eb;">
          <h1 style="color:#111827; margin:0 0 8px;">🎭 Theatre Reservation System</h1>
          <p style="color:#6b7280; margin:0 0 22px;">Η κράτησή σου ολοκληρώθηκε με επιτυχία.</p>

          <div style="background:#7c3aed; color:#ffffff; padding:18px; border-radius:16px; margin-bottom:22px;">
            <h2 style="margin:0 0 8px;">${ticket.show_title}</h2>
            <p style="margin:0;">Κωδικός κράτησης: <strong>#${ticket.reservation_id}</strong></p>
          </div>

          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:10px; color:#64748b; font-weight:bold;">Θέατρο</td>
              <td style="padding:10px; color:#111827;">${ticket.theatre_name}</td>
            </tr>
            <tr>
              <td style="padding:10px; color:#64748b; font-weight:bold;">Τοποθεσία</td>
              <td style="padding:10px; color:#111827;">${ticket.theatre_location}</td>
            </tr>
            <tr>
              <td style="padding:10px; color:#64748b; font-weight:bold;">Ημερομηνία</td>
              <td style="padding:10px; color:#111827;">${ticket.start_time_formatted}</td>
            </tr>
            <tr>
              <td style="padding:10px; color:#64748b; font-weight:bold;">Αίθουσα</td>
              <td style="padding:10px; color:#111827;">${ticket.hall_name}</td>
            </tr>
            <tr>
              <td style="padding:10px; color:#64748b; font-weight:bold;">Θέσεις</td>
              <td style="padding:10px; color:#111827;">${ticket.seats}</td>
            </tr>
            <tr>
              <td style="padding:10px; color:#64748b; font-weight:bold;">Σύνολο</td>
              <td style="padding:10px; color:#16a34a; font-weight:bold;">€${Number(ticket.total_price).toFixed(2)}</td>
            </tr>
          </table>

          <div style="margin-top:22px; padding:16px; border-radius:14px; background:#ede9fe; color:#4c1d95;">
            <strong>Οδηγία:</strong> Μπορείς να εμφανίσεις το ψηφιακό εισιτήριο ή το PDF στην είσοδο του θεάτρου.
          </div>

          <p style="color:#94a3b8; font-size:12px; margin-top:24px;">
            Αυτό το email δημιουργήθηκε αυτόματα από το Theatre Reservation System.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: ticket.user_email,
      subject: `Επιβεβαίωση Κράτησης #${ticket.reservation_id} - ${ticket.show_title}`,
      html,
    });

    console.log(`Reservation email sent to ${ticket.user_email}`);
    return true;
  } catch (error) {
    console.error("Send reservation email error:", error);
    return false;
  }
};

module.exports = {
  sendReservationEmail,
};
