## 🎭 Σύστημα Κρατήσεων Θεάτρου

Μία σύγχρονη full-stack εφαρμογή κρατήσεων θεάτρου με:

* διαχείριση χρηστών
* κρατήσεις θέσεων σε πραγματικό χρόνο
* ψηφιακά εισιτήρια
* PDF export
* QR ticket validation
* admin dashboard
* στατιστικά και analytics

Η εφαρμογή αναπτύχθηκε με στόχο την προσομοίωση ενός πραγματικού commercial theatre reservation platform.

---

# 📌 Περιγραφή Εφαρμογής

Το Theatre Reservation System επιτρέπει στους χρήστες να:

* κάνουν εγγραφή και σύνδεση
* βλέπουν διαθέσιμα θέατρα και παραστάσεις
* επιλέγουν ώρα προβολής
* πραγματοποιούν κράτηση θέσεων
* λαμβάνουν ψηφιακό εισιτήριο
* κατεβάζουν PDF ticket
* διαχειρίζονται τις κρατήσεις τους

Παράλληλα, το σύστημα περιλαμβάνει πλήρες admin dashboard για:

* προβολή στατιστικών
* έλεγχο κρατήσεων
* QR validation εισιτηρίων
* export κρατήσεων σε CSV
* monitoring του συστήματος

---

# 🛠 Τεχνολογίες

## Frontend

* React Native
* Expo
* Axios
* React Navigation
* AsyncStorage

## Backend

* Node.js
* Express.js
* JWT Authentication
* Nodemailer
* PDFKit

## Database

* MySQL

---

# 👤 Λειτουργίες Χρήστη

## Authentication

* Register
* Login
* JWT authentication
* Auto logout όταν λήγει το session

## Κρατήσεις

* Προβολή διαθέσιμων παραστάσεων
* Επιλογή θέσεων
* Real-time seat locking
* Ακύρωση κράτησης
* Ιστορικό κρατήσεων

## Ψηφιακά Εισιτήρια

* QR ticket generation
* PDF ticket export
* Ticket verification support

## UI / UX

* Responsive design
* Modern dark interface
* Toast notifications
* Reservation confirmation modal

---

# 👨‍💼 Admin Features

## Admin Dashboard

* Reservation analytics
* Revenue statistics
* Σύνολο κρατήσεων
* Active / cancelled tickets

## Reservation Management

* Προβολή όλων των κρατήσεων
* Search & filtering
* CSV export

## Ticket Verification

* QR scanner
* Ticket validation
* Invalid ticket detection

---

# 🔐 Security Features

* JWT authentication
* Protected admin routes
* Authorization middleware
* Seat validation
* Reservation ownership checks
* Session expiration handling

---

# 🧠 Advanced Features

* Real-time seat locking
* QR verification system
* PDF ticket export
* CSV reservation export
* Toast notification system
* Auto session handling
* Interactive dashboard

---

# 🗄 Database Structure

Το σύστημα χρησιμοποιεί MySQL database με βασικούς πίνακες:

* users
* theatres
* shows
* showtimes
* seats
* reservations
* reservation_seats

---

# 🚀 Εκτέλεση Project

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd mobile
npm install
npx expo start
```

---

# ⚙ Environment Variables

Παράδειγμα .env:

```env
JWT_SECRET=your_secret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=theatre_reservation_system
MAIL_ENABLED=false
```

---

# 📸 Προτεινόμενα Screenshots για Παρουσίαση

* Login screen
* Dashboard
* Επιλογή θέσεων
* Reservation confirmation
* QR ticket modal
* PDF ticket
* Admin dashboard
* CSV export
* QR scanner

---

# 🔮 Μελλοντικές Βελτιώσεις

* Online πληρωμές
* Push notifications
* Socket.io real-time synchronization
* Cloud deployment
* Mobile production build
* Multi-language support

---

# 📚 Εκπαιδευτικός Στόχος

Η εφαρμογή δημιουργήθηκε για ακαδημαϊκή εργασία με στόχο την ανάπτυξη ενός ολοκληρωμένου reservation system χρησιμοποιώντας σύγχρονες τεχνολογίες frontend, backend και database management.

Το project συνδυάζει:

* full-stack development
* authentication
* REST APIs
* database design
* PDF generation
* QR systems
* admin management
* responsive UI/UX

---

# 👨‍💻 Author

Developed by:

Anastasios Makrygiannis

Computer Science Student
