import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Dimensions,
} from "react-native";

import QRCode from "react-native-qrcode-svg";
import {
  BarChart,
  PieChart,
} from "react-native-chart-kit";
import { CameraView, useCameraPermissions } from "expo-camera";

import api from "../services/api";

function TicketQrVisual({ value }) {
  return (
    <View style={styles.qrBox}>
      <QRCode
        value={String(value || "TRS-TICKET")}
        size={178}
        backgroundColor="#ffffff"
        color="#0f172a"
      />
    </View>
  );
}

export default function HomeScreen({ user, token, onLogout }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedUntilBySeatId, setLockedUntilBySeatId] = useState({});

  const [showReservations, setShowReservations] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [adminReservations, setAdminReservations] = useState([]);

  const [showTicketVerification, setShowTicketVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerLocked, setScannerLocked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("Όλες");

  const [adminSearchText, setAdminSearchText] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("ALL");

  useEffect(() => {
    loadTheatres();
  }, []);

  const getToastType = (text) => {
    const value = String(text || "").toLowerCase();

    if (
      value.includes("επιτυχ") ||
      value.includes("ολοκληρώθηκε") ||
      value.includes("έγκυρο") ||
      value.includes("κατέβηκε") ||
      value.includes("σάρωση")
    ) {
      return "success";
    }

    if (
      value.includes("απέτυχε") ||
      value.includes("σφάλμα") ||
      value.includes("δεν ήταν δυνατ") ||
      value.includes("δεν βρέθηκε") ||
      value.includes("ακυρώθηκε") ||
      value.includes("μη έγκυρο")
    ) {
      return "error";
    }

    return "info";
  };

  const showToast = (text, type = "info") => {
    if (!text) return;

    setToast({
      text,
      type,
    });
  };

  useEffect(() => {
    if (!message) return;

    showToast(message, getToastType(message));

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const loadTheatres = async () => {
    try {
      setLoading(true);
      const response = await api.get("/theatres");
      setTheatres(response.data.theatres || []);
    } catch (error) {
      console.log("Σφάλμα φόρτωσης θεάτρων:", error);
      setMessage("Δεν ήταν δυνατή η φόρτωση των θεάτρων.");
    } finally {
      setLoading(false);
    }
  };

  const loadMyReservations = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/reservations/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReservations(response.data.reservations || []);
      setShowReservations(true);
    } catch (error) {
      console.log("Σφάλμα φόρτωσης κρατήσεων:", error);
      setMessage("Δεν ήταν δυνατή η φόρτωση των κρατήσεων.");
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    try {
      setLoading(true);
      setMessage("Γίνεται ακύρωση κράτησης...");

      const response = await api.patch(
        `/reservations/${reservationId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message || "Η κράτηση ακυρώθηκε με επιτυχία.");
      setSelectedTicket(null);

      await loadMyReservations();
    } catch (error) {
      console.log("Σφάλμα ακύρωσης κράτησης:", error);
      setMessage("Δεν ήταν δυνατή η ακύρωση της κράτησης.");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [statsResponse, reservationsResponse] = await Promise.all([
        api.get("/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        api.get("/admin/reservations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setAdminStats(statsResponse.data.stats || null);
      setAdminReservations(reservationsResponse.data.reservations || []);

      setShowAdminDashboard(true);
      setShowReservations(false);
      setShowProfile(false);
      setShowTicketVerification(false);

      setSelectedTheatre(null);
      setSelectedShow(null);
      setSelectedShowtime(null);
      setSelectedSeats([]);
      setLockedUntilBySeatId({});

      setShows([]);
      setShowtimes([]);
      setSeats([]);
    } catch (error) {
      console.log("Σφάλμα φόρτωσης admin dashboard:", error);
      setMessage("Δεν ήταν δυνατή η φόρτωση των admin δεδομένων.");
    } finally {
      setLoading(false);
    }
  };

  const loadShowsByTheatre = async (theatre) => {
    try {
      setMessage("");

      setSelectedTheatre(theatre);
      setSelectedShow(null);
      setSelectedShowtime(null);
      setShowReservations(false);
      setShowTicketVerification(false);

      setShows([]);
      setShowtimes([]);
      setSeats([]);
      setSelectedSeats([]);
      setLockedUntilBySeatId({});

      setLoading(true);

      const response = await api.get(
        `/shows?theatreId=${theatre.theatre_id}`
      );

      setShows(response.data.shows || []);
    } catch (error) {
      console.log("Σφάλμα φόρτωσης παραστάσεων:", error);
      setMessage("Δεν ήταν δυνατή η φόρτωση των παραστάσεων.");
    } finally {
      setLoading(false);
    }
  };

  const loadShowtimesByShow = async (show) => {
    try {
      setMessage("");

      setSelectedShow(show);
      setSelectedShowtime(null);

      setShowtimes([]);
      setSeats([]);
      setSelectedSeats([]);
      setLockedUntilBySeatId({});

      setLoading(true);

      const response = await api.get(`/showtimes?showId=${show.show_id}`);

      setShowtimes(response.data.showtimes || []);
    } catch (error) {
      console.log("Σφάλμα φόρτωσης showtimes:", error);
      setMessage("Δεν ήταν δυνατή η φόρτωση των διαθέσιμων ωρών.");
    } finally {
      setLoading(false);
    }
  };

  const loadSeatsByShowtime = async (showtime) => {
    try {
      setSelectedShowtime(showtime);

      setSeats([]);
      setSelectedSeats([]);
      setLockedUntilBySeatId({});

      setLoading(true);

      const response = await api.get(
        `/seats?showtimeId=${showtime.showtime_id}`
      );

      setSeats(response.data.seats || []);
    } catch (error) {
      console.log("Σφάλμα φόρτωσης θέσεων:", error);
      setMessage("Δεν ήταν δυνατή η φόρτωση των θέσεων.");
    } finally {
      setLoading(false);
    }
  };

  const isSeatLockedByOtherUser = (seat) => {
    if (!seat.locked_until || !seat.locked_by_user_id) return false;

    const lockedUntil = new Date(seat.locked_until);
    const now = new Date();

    return (
      lockedUntil > now &&
      Number(seat.locked_by_user_id) !== Number(user?.id)
    );
  };

  const lockSeat = async (seat) => {
    const response = await api.post(
      "/seats/lock",
      {
        seatId: seat.seat_id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setLockedUntilBySeatId((prev) => ({
      ...prev,
      [seat.seat_id]: response.data.lockedUntil,
    }));
  };

  const unlockSeat = async (seat) => {
    try {
      await api.post(
        "/seats/unlock",
        {
          seatId: seat.seat_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.log("Σφάλμα αποδέσμευσης θέσης:", error);
    }

    setLockedUntilBySeatId((prev) => {
      const updated = { ...prev };
      delete updated[seat.seat_id];
      return updated;
    });
  };

  const toggleSeat = async (seat) => {
    if (seat.is_reserved) return;

    if (isSeatLockedByOtherUser(seat)) {
      setMessage("Η θέση είναι προσωρινά δεσμευμένη από άλλον χρήστη.");
      return;
    }

    const exists = selectedSeats.find(
      (item) => item.seat_id === seat.seat_id
    );

    if (exists) {
      await unlockSeat(seat);

      setSelectedSeats((prev) =>
        prev.filter((item) => item.seat_id !== seat.seat_id)
      );

      return;
    }

    try {
      await lockSeat(seat);

      setSelectedSeats((prev) => [...prev, seat]);
      setMessage("Η θέση δεσμεύτηκε προσωρινά για 2 λεπτά.");
    } catch (error) {
      console.log("Σφάλμα προσωρινής δέσμευσης θέσης:", error);

      const backendMessage = error?.response?.data?.message;

      setMessage(
        backendMessage || "Δεν ήταν δυνατή η προσωρινή δέσμευση της θέσης."
      );

      if (selectedShowtime) {
        await loadSeatsByShowtime(selectedShowtime);
      }
    }
  };

  const createReservation = async () => {
    try {
      if (!selectedShowtime || selectedSeats.length === 0) {
        setMessage("Επίλεξε τουλάχιστον μία διαθέσιμη θέση.");
        return;
      }

      setLoading(true);
      setMessage("Γίνεται ολοκλήρωση κράτησης...");

      const response = await api.post(
        "/reservations",
        {
          showtimeId: selectedShowtime.showtime_id,
          seatIds: selectedSeats.map((seat) => seat.seat_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const successMessage =
        `Η κράτηση ολοκληρώθηκε με επιτυχία. ` +
        `Κωδικός κράτησης: ${response.data.reservationId}`;

      setBookingConfirmation({
        reservation_id: response.data.reservationId,
        show_title: selectedShow?.title,
        theatre_name: selectedShow?.theatre_name || selectedTheatre?.name,
        theatre_location:
          selectedShow?.theatre_location || selectedTheatre?.location,
        start_time: selectedShowtime?.start_time,
        hall_name: selectedShowtime?.hall_name,
        seats: selectedSeats
          .map((seat) => `${seat.seat_row}${seat.seat_number}`)
          .join(", "),
        total_price: Number(response.data.totalPrice || totalPrice),
      });

      await loadSeatsByShowtime(selectedShowtime);

      setSelectedSeats([]);
      setLockedUntilBySeatId({});
      setMessage(successMessage);
    } catch (error) {
      console.log("Σφάλμα κράτησης:", error);

      setMessage(
        "Η κράτηση απέτυχε. Κάποιες θέσεις μπορεί να έχουν ήδη κρατηθεί."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackHome = () => {
    setShowReservations(false);
    setShowProfile(false);
    setShowAdminDashboard(false);
    setShowTicketVerification(false);
    setShowAdminDashboard(false);
    setSelectedTheatre(null);
    setSelectedShow(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
      setLockedUntilBySeatId({});
    setShows([]);
    setShowtimes([]);
    setSeats([]);
    setMessage("");
  };

  const goBackToTheatres = () => {
    setMessage("");
    setSelectedTheatre(null);
    setSelectedShow(null);
    setSelectedShowtime(null);
    setShows([]);
    setShowtimes([]);
    setSeats([]);
    setSelectedSeats([]);
      setLockedUntilBySeatId({});
  };

  const goBackToShows = () => {
    setMessage("");
    setSelectedShow(null);
    setSelectedShowtime(null);
    setShowtimes([]);
    setSeats([]);
    setSelectedSeats([]);
      setLockedUntilBySeatId({});
  };

  const goBackToShowtimes = () => {
    setMessage("");
    setSelectedShowtime(null);
    setSeats([]);
    setSelectedSeats([]);
      setLockedUntilBySeatId({});
  };

  const openTicket = (reservation) => {
    setSelectedTicket(reservation);
  };

  const closeTicket = () => {
    setSelectedTicket(null);
  };

  const closeBookingConfirmation = () => {
    setBookingConfirmation(null);
  };

  const goToReservationsFromConfirmation = async () => {
    setBookingConfirmation(null);
    await loadMyReservations();
  };


  const downloadTicketPdf = async (reservationId) => {
    try {
      setMessage("Γίνεται δημιουργία PDF εισιτηρίου...");

      const response = await api.get(`/reservations/${reservationId}/pdf`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Platform.OS === "web") {
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");

        link.href = blobUrl;
        link.setAttribute("download", `ticket-${reservationId}.pdf`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(blobUrl);

        setMessage("Το PDF εισιτήριο κατέβηκε με επιτυχία.");
      } else {
        setMessage(
          "Η λήψη PDF είναι διαθέσιμη στο web preview. Στο κινητό μπορεί να προστεθεί με native file sharing."
        );
      }
    } catch (error) {
      console.log("Σφάλμα λήψης PDF:", error);
      setMessage("Δεν ήταν δυνατή η λήψη του PDF εισιτηρίου.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleString("el-GR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + Number(seat.price),
    0
  );

  const cities = [
    "Όλες",
    ...Array.from(new Set(theatres.map((theatre) => theatre.location))),
  ];

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredTheatres = theatres.filter((theatre) => {
    const matchesCity =
      selectedCity === "Όλες" || theatre.location === selectedCity;

    const matchesSearch =
      !normalizedSearch ||
      theatre.name.toLowerCase().includes(normalizedSearch) ||
      theatre.location.toLowerCase().includes(normalizedSearch) ||
      (theatre.description || "").toLowerCase().includes(normalizedSearch);

    return matchesCity && matchesSearch;
  });

  const filteredShows = shows.filter((show) => {
    const matchesSearch =
      !normalizedSearch ||
      show.title.toLowerCase().includes(normalizedSearch) ||
      show.theatre_name.toLowerCase().includes(normalizedSearch) ||
      (show.description || "").toLowerCase().includes(normalizedSearch);

    return matchesSearch;
  });

  const clearFilters = () => {
    setSearchText("");
    setSelectedCity("Όλες");
  };

  const activeTopTab = showTicketVerification
    ? "verification"
    : showAdminDashboard
    ? "admin"
    : showProfile
    ? "profile"
    : showReservations
    ? "reservations"
    : "home";

  const screenWidth = Math.min(Dimensions.get("window").width - 72, 720);

  const chartConfig = {
    backgroundColor: "#0f172a",
    backgroundGradientFrom: "#0f172a",
    backgroundGradientTo: "#0f172a",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(196, 181, 253, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(203, 213, 225, ${opacity})`,
    propsForBackgroundLines: {
      stroke: "#1e293b",
    },
    barPercentage: 0.7,
  };

  const statusChartData = [
    {
      name: "Ενεργές",
      population: Number(adminStats?.active_reservations || 0),
      color: "#22c55e",
      legendFontColor: "#cbd5e1",
      legendFontSize: 13,
    },
    {
      name: "Ακυρωμένες",
      population: Number(adminStats?.cancelled_reservations || 0),
      color: "#ef4444",
      legendFontColor: "#cbd5e1",
      legendFontSize: 13,
    },
  ].filter((item) => item.population > 0);

  const popularShowsChartLabels =
    adminStats?.popular_shows?.length > 0
      ? adminStats.popular_shows
          .slice(0, 5)
          .map((show) =>
            String(show.title || "Show").length > 10
              ? `${String(show.title).slice(0, 10)}...`
              : String(show.title || "Show")
          )
      : ["Δεν υπάρχουν"];

  const popularShowsChartValues =
    adminStats?.popular_shows?.length > 0
      ? adminStats.popular_shows
          .slice(0, 5)
          .map((show) => Number(show.reservations_count || 0))
      : [0];

  const normalizedAdminSearch = adminSearchText.trim().toLowerCase();

  const filteredAdminReservations = adminReservations.filter((reservation) => {
    const matchesStatus =
      adminStatusFilter === "ALL" ||
      reservation.status === adminStatusFilter;

    const searchPool = [
      reservation.reservation_id,
      reservation.show_title,
      reservation.theatre_name,
      reservation.theatre_location,
      reservation.user_name,
      reservation.user_email,
      reservation.seats,
      reservation.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedAdminSearch ||
      searchPool.includes(normalizedAdminSearch);

    return matchesStatus && matchesSearch;
  });

  const clearAdminFilters = () => {
    setAdminSearchText("");
    setAdminStatusFilter("ALL");
  };

  const activeReservations = reservations.filter(
    (r) => r.status !== "CANCELLED"
  );

  const cancelledReservations = reservations.filter(
    (r) => r.status === "CANCELLED"
  );

  const totalSpent = activeReservations.reduce(
    (sum, r) => sum + Number(r.total_price || 0),
    0
  );

  const openProfile = async () => {
    await loadMyReservations();
    setShowProfile(true);
    setShowReservations(false);
    setShowAdminDashboard(false);
    setShowTicketVerification(false);
  };

  const openTicketVerification = () => {
    setMessage("");
    setShowTicketVerification(true);
    setShowReservations(false);
    setShowProfile(false);
    setShowAdminDashboard(false);
    setSelectedTheatre(null);
    setSelectedShow(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
      setLockedUntilBySeatId({});
    setShows([]);
    setShowtimes([]);
    setSeats([]);
    setVerificationResult(null);
  };

  const verifyTicketCode = async () => {
    try {
      const cleanCode = verificationCode.trim();

      if (!cleanCode) {
        setMessage("Δώσε κωδικό κράτησης.");
        return;
      }

      setMessage("");
      setVerificationLoading(true);
      setVerificationResult(null);

      const response = await api.get(`/staff/verify/${cleanCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVerificationResult(response.data);
    } catch (error) {
      console.log("Verify ticket error:", error);

      const backendData = error?.response?.data;

      setVerificationResult({
        success: false,
        valid: false,
        status: backendData?.status || "ERROR",
        message:
          backendData?.message ||
          "Δεν ήταν δυνατός ο έλεγχος εισιτηρίου.",
        ticket: backendData?.ticket || null,
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const extractReservationCodeFromQr = (rawValue) => {
    const value = String(rawValue || "").trim();

    if (!value) return "";

    const trsMatch = value.match(/TRS-(\d+)/i);
    if (trsMatch?.[1]) return trsMatch[1];

    const hashMatch = value.match(/#(\d+)/);
    if (hashMatch?.[1]) return hashMatch[1];

    const numberMatch = value.match(/\d+/);
    if (numberMatch?.[0]) return numberMatch[0];

    return value;
  };

  const openQrScanner = async () => {
    setMessage("");
    setVerificationResult(null);
    setScannerLocked(false);

    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();

      if (!result?.granted) {
        setMessage("Δεν δόθηκε άδεια χρήσης κάμερας.");
        return;
      }
    }

    setScannerVisible(true);
  };

  const closeQrScanner = () => {
    setScannerVisible(false);
    setScannerLocked(false);
  };

  const handleQrScanned = async ({ data }) => {
    if (scannerLocked) return;

    const extractedCode = extractReservationCodeFromQr(data);

    if (!extractedCode) {
      setMessage("Δεν αναγνωρίστηκε κωδικός κράτησης από το QR.");
      return;
    }

    setScannerLocked(true);
    setScannerVisible(false);
    setVerificationCode(extractedCode);

    try {
      setVerificationLoading(true);
      setVerificationResult(null);

      const response = await api.get(`/staff/verify/${extractedCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVerificationResult(response.data);
      setMessage(`Έγινε σάρωση QR για κράτηση #${extractedCode}.`);
    } catch (error) {
      console.log("QR verify error:", error);

      const backendData = error?.response?.data;

      setVerificationResult({
        success: false,
        valid: false,
        status: backendData?.status || "ERROR",
        message:
          backendData?.message ||
          "Δεν ήταν δυνατός ο έλεγχος του QR εισιτηρίου.",
        ticket: backendData?.ticket || null,
      });
    } finally {
      setVerificationLoading(false);
      setScannerLocked(false);
    }
  };

  const handleAdminReservationsCsvExport = async () => {
    try {
      setMessage("Γίνεται export των κρατήσεων σε CSV...");

      const response = await api.get("/admin/reservations/export", {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Platform.OS === "web") {
        const blobUrl = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "text/csv;charset=utf-8;",
          })
        );

        const link = document.createElement("a");
        const today = new Date().toISOString().slice(0, 10);

        link.href = blobUrl;
        link.setAttribute("download", `reservations-export-${today}.csv`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(blobUrl);

        setMessage("Το CSV αρχείο κατέβηκε με επιτυχία.");
      } else {
        setMessage("Το CSV export είναι διαθέσιμο στο web preview.");
      }
    } catch (error) {
      console.log("CSV export error:", error);
      setMessage("Δεν ήταν δυνατή η λήψη του CSV αρχείου.");
    }
  };

  return (
    <>
      {toast ? (
        <View
          style={[
            styles.toastContainer,
            toast.type === "success" && styles.toastSuccess,
            toast.type === "error" && styles.toastError,
            toast.type === "info" && styles.toastInfo,
          ]}
        >
          <View style={styles.toastIconBox}>
            <Text style={styles.toastIcon}>
              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                ? "!"
                : "i"}
            </Text>
          </View>

          <Text style={styles.toastText}>{toast.text}</Text>

          <TouchableOpacity
            onPress={() => setToast(null)}
            style={styles.toastCloseButton}
          >
            <Text style={styles.toastCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Καλώς ήρθες,</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>

          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Έξοδος</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Κρατήσεις Θεάτρου</Text>
          <Text style={styles.heroText}>
            Δες διαθέσιμες παραστάσεις, ώρες προβολών και κάνε κράτηση θέσεων.
          </Text>
        </View>

        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={[
              styles.topNavButton,
              activeTopTab === "home" && styles.topNavButtonActive,
            ]}
            onPress={goBackHome}
          >
            <Text style={styles.topButtonText}>Αρχική</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topNavButton,
              activeTopTab === "reservations" && styles.topNavButtonActive,
            ]}
            onPress={loadMyReservations}
          >
            <Text style={styles.topButtonText}>Οι Κρατήσεις μου</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topNavButton,
              activeTopTab === "profile" && styles.topNavButtonActive,
            ]}
            onPress={openProfile}
          >
            <Text style={styles.topButtonText}>Προφίλ</Text>
          </TouchableOpacity>

          {user?.role === "ADMIN" ? (
            <>
              <TouchableOpacity
                style={[
                  styles.topNavButton,
                  activeTopTab === "admin" && styles.topNavButtonActive,
                ]}
                onPress={loadAdminStats}
              >
                <Text style={styles.topButtonText}>Admin Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.topNavButton,
                  activeTopTab === "verification" && styles.topNavButtonActive,
                ]}
                onPress={openTicketVerification}
              >
                <Text style={styles.topButtonText}>Έλεγχος Εισιτηρίου</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {!showReservations &&
        !showTicketVerification &&
        !selectedShowtime &&
        !selectedShow ? (
          <View style={styles.searchCard}>
            <Text style={styles.searchTitle}>Αναζήτηση & Φίλτρα</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Αναζήτηση με τίτλο, θέατρο ή τοποθεσία..."
              placeholderTextColor="#64748b"
              value={searchText}
              onChangeText={setSearchText}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityFilterRow}
            >
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityChip,
                    selectedCity === city && styles.cityChipActive,
                  ]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      selectedCity === city && styles.cityChipTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.clearFilterChip} onPress={clearFilters}>
                <Text style={styles.clearFilterText}>Καθαρισμός</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#7c3aed" />
        ) : showTicketVerification ? (
          <>
            <Text style={styles.sectionTitle}>Έλεγχος Εισιτηρίου</Text>

            <View style={styles.verificationHero}>
              <Text style={styles.verificationHeroTitle}>
                Staff Ticket Verification
              </Text>

              <Text style={styles.verificationHeroText}>
                Πληκτρολόγησε τον κωδικό κράτησης για να ελέγξεις αν το εισιτήριο
                είναι έγκυρο, ακυρωμένο ή αν δεν υπάρχει στο σύστημα.
              </Text>
            </View>

            <View style={styles.verificationCard}>
              <Text style={styles.verificationLabel}>Κωδικός Κράτησης</Text>

              <TextInput
                style={styles.verificationInput}
                placeholder="π.χ. 1"
                placeholderTextColor="#64748b"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.scanQrButton}
                onPress={openQrScanner}
              >
                <Text style={styles.scanQrButtonText}>
                  Σάρωση QR Εισιτηρίου
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  verificationLoading && styles.disabledButton,
                ]}
                onPress={verifyTicketCode}
                disabled={verificationLoading}
              >
                <Text style={styles.verifyButtonText}>
                  {verificationLoading
                    ? "Γίνεται έλεγχος..."
                    : "Έλεγχος Εισιτηρίου"}
                </Text>
              </TouchableOpacity>
            </View>

            {verificationResult ? (
              <View
                style={[
                  styles.verificationResultCard,
                  verificationResult.valid
                    ? styles.verificationValid
                    : styles.verificationInvalid,
                ]}
              >
                <Text style={styles.verificationStatus}>
                  {verificationResult.valid
                    ? "✅ ΕΓΚΥΡΟ ΕΙΣΙΤΗΡΙΟ"
                    : verificationResult.status === "CANCELLED"
                    ? "❌ ΑΚΥΡΩΜΕΝΟ ΕΙΣΙΤΗΡΙΟ"
                    : "⚠️ ΜΗ ΕΓΚΥΡΟ ΕΙΣΙΤΗΡΙΟ"}
                </Text>

                <Text style={styles.verificationMessage}>
                  {verificationResult.message}
                </Text>

                {verificationResult.ticket ? (
                  <View style={styles.verificationTicketBox}>
                    <Text style={styles.verificationTicketTitle}>
                      {verificationResult.ticket.show_title}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      🎭 Θέατρο: {verificationResult.ticket.theatre_name}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      📍 Περιοχή: {verificationResult.ticket.theatre_location}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      👤 Πελάτης: {verificationResult.ticket.user_name}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      📧 Email: {verificationResult.ticket.user_email}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      📅 Ημερομηνία: {formatDate(verificationResult.ticket.start_time)}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      🏛 Αίθουσα: {verificationResult.ticket.hall_name}
                    </Text>

                    <Text style={styles.verificationTicketText}>
                      💺 Θέσεις: {verificationResult.ticket.seats || "-"}
                    </Text>

                    <Text style={styles.verificationTicketPrice}>
                      Σύνολο: €{Number(verificationResult.ticket.total_price).toFixed(2)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        ) : showAdminDashboard ? (
          <>
            <Text style={styles.sectionTitle}>Admin Dashboard</Text>

            <View style={styles.adminHeroCard}>
              <Text style={styles.adminHeroTitle}>Στατιστικά Συστήματος</Text>
              <Text style={styles.adminHeroText}>
                Συνολική εικόνα κρατήσεων, θέσεων, εσόδων και δημοφιλών παραστάσεων.
              </Text>
            </View>

            <View style={styles.adminStatsGrid}>
              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>🎟</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.total_reservations ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Συνολικές Κρατήσεις</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>✅</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.active_reservations ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Ενεργές Κρατήσεις</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>❌</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.cancelled_reservations ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Ακυρωμένες</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>💶</Text>
                <Text style={styles.adminStatValue}>
                  €{Number(adminStats?.active_revenue || 0).toFixed(0)}
                </Text>
                <Text style={styles.adminStatLabel}>Ενεργά Έσοδα</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>💺</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.reserved_seats ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Κρατημένες Θέσεις</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>🟦</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.available_seats ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Διαθέσιμες Θέσεις</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>🏛</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.total_theatres ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Θέατρα</Text>
              </View>

              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>🎭</Text>
                <Text style={styles.adminStatValue}>
                  {adminStats?.total_shows ?? 0}
                </Text>
                <Text style={styles.adminStatLabel}>Παραστάσεις</Text>
              </View>
            </View>

            <View style={styles.analyticsSectionCard}>
              <Text style={styles.adminSectionTitle}>Live Analytics</Text>
              <Text style={styles.adminSectionSubtitle}>
                Οπτική ανάλυση κρατήσεων και απόδοσης παραστάσεων.
              </Text>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Ενεργές vs Ακυρωμένες Κρατήσεις</Text>

                {statusChartData.length > 0 ? (
                  <PieChart
                    data={statusChartData}
                    width={screenWidth}
                    height={210}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="12"
                    absolute
                  />
                ) : (
                  <Text style={styles.description}>
                    Δεν υπάρχουν δεδομένα για γράφημα κατάστασης.
                  </Text>
                )}
              </View>

              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Κρατήσεις ανά Δημοφιλή Παράσταση</Text>

                <BarChart
                  data={{
                    labels: popularShowsChartLabels,
                    datasets: [
                      {
                        data: popularShowsChartValues,
                      },
                    ],
                  }}
                  width={screenWidth}
                  height={245}
                  chartConfig={chartConfig}
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines
                  style={styles.chart}
                />
              </View>
            </View>

            <View style={styles.adminSectionCard}>
              <Text style={styles.adminSectionTitle}>Δημοφιλείς Παραστάσεις</Text>

              {adminStats?.popular_shows?.length > 0 ? (
                adminStats.popular_shows.map((show, index) => (
                  <View key={`${show.title}-${index}`} style={styles.popularShowRow}>
                    <View style={styles.popularRank}>
                      <Text style={styles.popularRankText}>{index + 1}</Text>
                    </View>

                    <View style={styles.popularShowInfo}>
                      <Text style={styles.popularShowTitle}>{show.title}</Text>
                      <Text style={styles.popularShowTheatre}>{show.theatre_name}</Text>
                    </View>

                    <View style={styles.popularShowMeta}>
                      <Text style={styles.popularShowCount}>
                        {show.reservations_count} κρατήσεις
                      </Text>
                      <Text style={styles.popularShowRevenue}>
                        €{Number(show.revenue || 0).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.description}>
                  Δεν υπάρχουν ακόμα αρκετά δεδομένα.
                </Text>
              )}
            </View>

            <View style={styles.adminSectionCard}>
              <View style={styles.adminListHeader}>
                <View>
                  <Text style={styles.adminSectionTitle}>Όλες οι Κρατήσεις</Text>
                  <Text style={styles.adminSectionSubtitle}>
                    Πλήρης λίστα κρατήσεων όλων των χρηστών.
                  </Text>
                </View>

                <View style={styles.adminHeaderActions}>
                  <TouchableOpacity
                    style={styles.adminExportButton}
                    onPress={handleAdminReservationsCsvExport}
                  >
                    <Text style={styles.adminExportButtonText}>Export CSV</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.adminRefreshButton}
                    onPress={loadAdminStats}
                  >
                    <Text style={styles.adminRefreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.adminFiltersCard}>
                <TextInput
                  style={styles.adminSearchInput}
                  placeholder="Αναζήτηση με email, όνομα, παράσταση ή κωδικό..."
                  placeholderTextColor="#64748b"
                  value={adminSearchText}
                  onChangeText={setAdminSearchText}
                />

                <View style={styles.adminFilterChipsRow}>
                  {["ALL", "ACTIVE", "CANCELLED"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.adminFilterChip,
                        adminStatusFilter === status &&
                          styles.adminFilterChipActive,
                      ]}
                      onPress={() => setAdminStatusFilter(status)}
                    >
                      <Text
                        style={[
                          styles.adminFilterChipText,
                          adminStatusFilter === status &&
                            styles.adminFilterChipTextActive,
                        ]}
                      >
                        {status === "ALL" ? "Όλες" : status}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.adminClearFilterButton}
                    onPress={clearAdminFilters}
                  >
                    <Text style={styles.adminClearFilterText}>Καθαρισμός</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.adminFilterResultText}>
                  Αποτελέσματα: {filteredAdminReservations.length} / {adminReservations.length}
                </Text>
              </View>

              {adminReservations.length === 0 ? (
                <Text style={styles.description}>
                  Δεν υπάρχουν κρατήσεις στο σύστημα.
                </Text>
              ) : filteredAdminReservations.length === 0 ? (
                <Text style={styles.description}>
                  Δεν βρέθηκαν κρατήσεις με τα συγκεκριμένα φίλτρα.
                </Text>
              ) : (
                filteredAdminReservations.map((reservation) => (
                  <View
                    key={`admin-res-${reservation.reservation_id}`}
                    style={styles.adminReservationCard}
                  >
                    <View style={styles.adminReservationTop}>
                      <View style={styles.adminReservationMain}>
                        <Text style={styles.adminReservationTitle}>
                          #{reservation.reservation_id} • {reservation.show_title}
                        </Text>

                        <Text style={styles.adminReservationSub}>
                          {reservation.theatre_name} • {reservation.theatre_location}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.adminStatusBadge,
                          reservation.status === "CANCELLED"
                            ? styles.adminStatusCancelled
                            : styles.adminStatusActive,
                        ]}
                      >
                        {reservation.status}
                      </Text>
                    </View>

                    <View style={styles.adminReservationGrid}>
                      <Text style={styles.adminReservationText}>
                        👤 {reservation.user_name}
                      </Text>

                      <Text style={styles.adminReservationText}>
                        📧 {reservation.user_email}
                      </Text>

                      <Text style={styles.adminReservationText}>
                        📅 {formatDate(reservation.start_time)}
                      </Text>

                      <Text style={styles.adminReservationText}>
                        🏛 {reservation.hall_name}
                      </Text>

                      <Text style={styles.adminReservationText}>
                        💺 {reservation.seats || "-"}
                      </Text>

                      <Text style={styles.adminReservationPrice}>
                        €{Number(reservation.total_price || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : showProfile ? (
          <>
            <Text style={styles.sectionTitle}>Το Προφίλ μου</Text>

            <View style={styles.profileCard}>
              <View style={styles.profileLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.profileTextBlock}>
                  <Text style={styles.profileName}>
                    {user?.name}
                  </Text>

                  <Text style={styles.profileEmail}>
                    {user?.email || "theatre.user@example.com"}
                  </Text>

                  <Text style={styles.memberBadge}>
                    Μέλος συστήματος κρατήσεων
                  </Text>
                </View>
              </View>

              <View style={styles.profileRight}>
                <Text style={styles.profileQuote}>
                  🎭 Κλείσε εύκολα τη θέση σου και διαχειρίσου τις κρατήσεις σου ψηφιακά.
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {reservations.length}
                </Text>

                <Text style={styles.statLabel}>
                  Συνολικές Κρατήσεις
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {activeReservations.length}
                </Text>

                <Text style={styles.statLabel}>
                  Ενεργές
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {cancelledReservations.length}
                </Text>

                <Text style={styles.statLabel}>
                  Ακυρωμένες
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  €{totalSpent.toFixed(0)}
                </Text>

                <Text style={styles.statLabel}>
                  Σύνολο Αγορών
                </Text>
              </View>
            </View>

            <View style={styles.profileInfoCard}>
              <Text style={styles.profileInfoTitle}>
                Πληροφορίες Λογαριασμού
              </Text>

              <Text style={styles.profileInfoText}>
                • Premium mobile theatre reservation system
              </Text>

              <Text style={styles.profileInfoText}>
                • Ψηφιακά QR εισιτήρια
              </Text>

              <Text style={styles.profileInfoText}>
                • Διαχείριση κρατήσεων σε πραγματικό χρόνο
              </Text>

              <Text style={styles.profileInfoText}>
                • Σύγχρονο UI/UX σε React Native
              </Text>
            </View>
          </>
        ) : showReservations ? (
          <>
            <Text style={styles.sectionTitle}>Το Ιστορικό Κρατήσεών μου</Text>

            {reservations.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.description}>Δεν υπάρχουν κρατήσεις.</Text>
              </View>
            ) : (
              reservations.map((reservation) => (
                <TouchableOpacity
                  key={reservation.reservation_id}
                  style={styles.card}
                  onPress={() => openTicket(reservation)}
                >
                  <View style={styles.reservationHeader}>
                    <View>
                      <Text style={styles.cardTitle}>
                        {reservation.show_title}
                      </Text>
                      <Text style={styles.location}>
                        🎭 {reservation.theatre_name}
                      </Text>
                    </View>

                    <View style={styles.ticketBadge}>
                      <Text style={styles.ticketBadgeText}>🎟 Εισιτήριο</Text>
                    </View>
                  </View>

                  <Text style={styles.description}>
                    📍 {reservation.theatre_location}
                  </Text>

                  <Text style={styles.description}>
                    📅 {formatDate(reservation.start_time)}
                  </Text>

                  <Text style={styles.description}>
                    🏛 Αίθουσα: {reservation.hall_name}
                  </Text>

                  <Text style={styles.description}>
                    💺 Θέσεις: {reservation.seats || "Δεν υπάρχουν στοιχεία"}
                  </Text>

                  <View style={styles.reservationFooter}>
                    <Text style={styles.statusPill}>
                      Κατάσταση: {reservation.status}
                    </Text>

                    <Text style={styles.statusPill}>
                      Κωδικός: {reservation.reservation_id}
                    </Text>
                  </View>

                  <Text style={styles.priceText}>
                    Σύνολο: €{Number(reservation.total_price).toFixed(2)}
                  </Text>

                  <Text style={styles.tapHint}>
                    Πάτησε για προβολή ψηφιακού εισιτηρίου
                  </Text>

                  {reservation.status !== "CANCELLED" ? (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        cancelReservation(reservation.reservation_id);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>
                        Ακύρωση Κράτησης
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.cancelledText}>
                      Η κράτηση έχει ακυρωθεί.
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        ) : selectedShowtime ? (
          <>
            <TouchableOpacity onPress={goBackToShowtimes} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Πίσω στις Ώρες</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Επιλογή Θέσεων</Text>

            <View style={styles.selectedCard}>
              <Text style={styles.selectedTitle}>{selectedShow?.title}</Text>

              <Text style={styles.selectedSubtitle}>
                {formatDate(selectedShowtime.start_time)} • {selectedShowtime.hall_name}
              </Text>
            </View>

            <View style={styles.legendRow}>
              <Text style={styles.legendText}>🟦 Διαθέσιμη</Text>
              <Text style={styles.legendText}>🟪 Επιλεγμένη από εσένα</Text>
              <Text style={styles.legendText}>🟨 Προσωρινά δεσμευμένη</Text>
              <Text style={styles.legendText}>⬛ Κρατημένη</Text>
            </View>

            <View style={styles.seatGrid}>
              {seats.map((seat) => {
                const isSelected = selectedSeats.some(
                  (item) => item.seat_id === seat.seat_id
                );

                const lockedByOtherUser = isSeatLockedByOtherUser(seat);

                return (
                  <TouchableOpacity
                    key={seat.seat_id}
                    style={[
                      styles.seatButton,
                      seat.is_reserved && styles.seatReserved,
                      lockedByOtherUser && styles.seatLocked,
                      isSelected && styles.seatSelected,
                    ]}
                    onPress={() => toggleSeat(seat)}
                    disabled={Boolean(seat.is_reserved || lockedByOtherUser)}
                  >
                    <Text style={styles.seatText}>
                      {seat.seat_row}
                      {seat.seat_number}
                    </Text>

                    <Text style={styles.seatPrice}>
                      {lockedByOtherUser ? "Locked" : `€${seat.price}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Σύνοψη Κράτησης</Text>

              <Text style={styles.lockInfoText}>
                Οι επιλεγμένες θέσεις δεσμεύονται προσωρινά για 2 λεπτά.
              </Text>

              <Text style={styles.summaryText}>
                Επιλεγμένες θέσεις:{" "}
                {selectedSeats.length > 0
                  ? selectedSeats
                      .map((seat) => `${seat.seat_row}${seat.seat_number}`)
                      .join(", ")
                  : "Καμία"}
              </Text>

              <Text style={styles.summaryText}>
                Σύνολο: €{totalPrice.toFixed(2)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.reserveButton,
                  selectedSeats.length === 0 && styles.disabledButton,
                ]}
                onPress={createReservation}
                disabled={selectedSeats.length === 0}
              >
                <Text style={styles.reserveButtonText}>
                  Ολοκλήρωση Κράτησης
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : selectedShow ? (
          <>
            <TouchableOpacity onPress={goBackToShows} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Πίσω στις Παραστάσεις</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Διαθέσιμες Ώρες</Text>

            <View style={styles.selectedCard}>
              <Text style={styles.selectedTitle}>{selectedShow.title}</Text>
              <Text style={styles.selectedSubtitle}>
                {selectedShow.theatre_name}
              </Text>
            </View>

            {showtimes.map((showtime) => (
              <View key={showtime.showtime_id} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {formatDate(showtime.start_time)}
                </Text>

                <Text style={styles.location}>
                  🏛 Αίθουσα: {showtime.hall_name}
                </Text>

                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => loadSeatsByShowtime(showtime)}
                >
                  <Text style={styles.cardButtonText}>Επιλογή Θέσεων</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : selectedTheatre ? (
          <>
            <TouchableOpacity onPress={goBackToTheatres} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Πίσω στα Θέατρα</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>
              Παραστάσεις στο {selectedTheatre.name}
            </Text>

            {filteredShows.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.description}>
                  Δεν βρέθηκαν παραστάσεις με τα συγκεκριμένα κριτήρια.
                </Text>
              </View>
            ) : null}

            {filteredShows.map((show) => (
              <View key={show.show_id} style={styles.card}>
                <Text style={styles.cardTitle}>{show.title}</Text>

                <Text style={styles.location}>🎭 {show.theatre_name}</Text>

                <Text style={styles.description}>{show.description}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoBadge}>
                    ⏱ {show.duration_minutes} λεπτά
                  </Text>

                  <Text style={styles.infoBadge}>
                    🔞 {show.age_rating}
                  </Text>

                  <Text style={styles.infoBadge}>
                    €{show.base_price}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => loadShowtimesByShow(show)}
                >
                  <Text style={styles.cardButtonText}>
                    Επιλογή Παράστασης
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Διαθέσιμα Θέατρα</Text>

            {filteredTheatres.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.description}>
                  Δεν βρέθηκαν θέατρα με τα συγκεκριμένα κριτήρια.
                </Text>
              </View>
            ) : null}

            {filteredTheatres.map((theatre) => (
              <View key={theatre.theatre_id} style={styles.card}>
                <Text style={styles.cardTitle}>{theatre.name}</Text>

                <Text style={styles.location}>📍 {theatre.location}</Text>

                <Text style={styles.description}>{theatre.description}</Text>

                <TouchableOpacity
                  style={styles.cardButton}
                  onPress={() => loadShowsByTheatre(theatre)}
                >
                  <Text style={styles.cardButtonText}>
                    Προβολή Παραστάσεων
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>


      <Modal
        visible={Boolean(bookingConfirmation)}
        transparent
        animationType="fade"
        onRequestClose={closeBookingConfirmation}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationIconCircle}>
              <Text style={styles.confirmationIcon}>✓</Text>
            </View>

            <Text style={styles.confirmationTitle}>
              Η κράτηση ολοκληρώθηκε
            </Text>

            <Text style={styles.confirmationSubtitle}>
              Το εισιτήριό σου δημιουργήθηκε με επιτυχία.
            </Text>

            {bookingConfirmation ? (
              <View style={styles.confirmationInfoBox}>
                <Text style={styles.confirmationCode}>
                  #{bookingConfirmation.reservation_id}
                </Text>

                <Text style={styles.confirmationShowTitle}>
                  {bookingConfirmation.show_title}
                </Text>

                <Text style={styles.confirmationInfoText}>
                  🎭 {bookingConfirmation.theatre_name}
                </Text>

                <Text style={styles.confirmationInfoText}>
                  📅 {formatDate(bookingConfirmation.start_time)}
                </Text>

                <Text style={styles.confirmationInfoText}>
                  💺 {bookingConfirmation.seats}
                </Text>

                <Text style={styles.confirmationTotal}>
                  Σύνολο: €{Number(bookingConfirmation.total_price || 0).toFixed(2)}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.confirmationPrimaryButton}
              onPress={goToReservationsFromConfirmation}
            >
              <Text style={styles.confirmationPrimaryButtonText}>
                Οι Κρατήσεις μου
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeBookingConfirmation}
              style={styles.confirmationCloseButton}
            >
              <Text style={styles.confirmationCloseText}>
                Κλείσιμο
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={scannerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeQrScanner}
      >
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerPanel}>
            <View style={styles.scannerTopBar}>
              <Text style={styles.scannerTitle}>Σάρωση QR Εισιτηρίου</Text>

              <TouchableOpacity onPress={closeQrScanner} style={styles.scannerCloseButton}>
                <Text style={styles.scannerCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.scannerSubtitle}>
              Στόχευσε το QR code του εισιτηρίου για αυτόματο έλεγχο.
            </Text>

            <View style={styles.cameraFrame}>
              {scannerVisible ? (
                <CameraView
                  style={styles.cameraView}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={scannerLocked ? undefined : handleQrScanned}
                />
              ) : null}

              <View style={styles.scannerCorners}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
            </View>

            <Text style={styles.scannerHint}>
              Υποστηρίζεται QR μορφής TRS-κωδικός, π.χ. TRS-12.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedTicket)}
        transparent
        animationType="fade"
        onRequestClose={closeTicket}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ticketModal}>
            <View style={styles.ticketTopBar}>
              <Text style={styles.ticketTitle}>Ψηφιακό Εισιτήριο</Text>

              <TouchableOpacity onPress={closeTicket} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedTicket ? (
              <>
                <Text style={styles.ticketShowTitle}>
                  {selectedTicket.show_title}
                </Text>

                <Text style={styles.ticketMuted}>
                  {selectedTicket.theatre_name} • {selectedTicket.theatre_location}
                </Text>

                <View style={styles.qrWrapper}>
                  <TicketQrVisual
                    value={`TRS-${selectedTicket.reservation_id}`}
                  />
                  <Text style={styles.ticketQrCodeText}>
                    TRS-{selectedTicket.reservation_id}
                  </Text>
                </View>

                <View style={styles.ticketInfoBox}>
                  <Text style={styles.ticketInfoText}>
                    Κωδικός κράτησης: #{selectedTicket.reservation_id}
                  </Text>

                  <Text style={styles.ticketInfoText}>
                    Ημερομηνία: {formatDate(selectedTicket.start_time)}
                  </Text>

                  <Text style={styles.ticketInfoText}>
                    Αίθουσα: {selectedTicket.hall_name}
                  </Text>

                  <Text style={styles.ticketInfoText}>
                    Θέσεις: {selectedTicket.seats || "Δεν υπάρχουν στοιχεία"}
                  </Text>

                  <Text style={styles.ticketInfoText}>
                    Κατάσταση: {selectedTicket.status}
                  </Text>

                  <Text style={styles.ticketTotal}>
                    Σύνολο: €{Number(selectedTicket.total_price).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.ticketPdfButton}
                  onPress={() =>
                    downloadTicketPdf(selectedTicket.reservation_id)
                  }
                >
                  <Text style={styles.ticketPdfButtonText}>
                    📄 Λήψη PDF Εισιτηρίου
                  </Text>
                </TouchableOpacity>

                {selectedTicket.status !== "CANCELLED" ? (
                  <TouchableOpacity
                    style={styles.ticketCancelButton}
                    onPress={() =>
                      cancelReservation(selectedTicket.reservation_id)
                    }
                  >
                    <Text style={styles.ticketCancelButtonText}>
                      Ακύρωση Κράτησης
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.ticketCancelledText}>
                    Η κράτηση έχει ακυρωθεί και το εισιτήριο δεν είναι ενεργό.
                  </Text>
                )}

                <Text style={styles.ticketHint}>
                  Εμφάνισε αυτό το εισιτήριο στην είσοδο του θεάτρου.
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    zIndex: 9999,
    minHeight: 58,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },

  toastSuccess: {
    backgroundColor: "#052e16",
    borderColor: "#22c55e",
  },

  toastError: {
    backgroundColor: "#450a0a",
    borderColor: "#ef4444",
  },

  toastInfo: {
    backgroundColor: "#172554",
    borderColor: "#3b82f6",
  },

  toastIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },

  toastIcon: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },

  toastText: {
    flex: 1,
    color: "#ffffff",
    fontWeight: "900",
    lineHeight: 20,
  },

  toastCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  toastCloseText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 20,
    marginTop: -2,
  },

  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  content: {
    padding: 22,
    paddingBottom: 40,
  },

  header: {
    marginTop: 20,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    color: "#94a3b8",
    fontSize: 15,
  },

  name: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
  },

  logoutButton: {
    backgroundColor: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  logoutText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  heroCard: {
    backgroundColor: "#7c3aed",
    padding: 24,
    borderRadius: 26,
    marginBottom: 18,
  },

  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },

  heroText: {
    color: "#ddd6fe",
    fontSize: 15,
  },

  topButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  topNavButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  topNavButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  topButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  searchCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 18,
    borderRadius: 22,
    marginBottom: 18,
  },

  searchTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },

  searchInput: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#ffffff",
    padding: 14,
    borderRadius: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  cityFilterRow: {
    gap: 8,
    paddingRight: 10,
  },

  cityChip: {
    backgroundColor: "#1e293b",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
  },

  cityChipActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#c4b5fd",
  },

  cityChipText: {
    color: "#cbd5e1",
    fontWeight: "800",
  },

  cityChipTextActive: {
    color: "#ffffff",
  },

  clearFilterChip: {
    backgroundColor: "#334155",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
  },

  clearFilterText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  verificationHero: {
    backgroundColor: "#1e1b4b",
    borderWidth: 1,
    borderColor: "#312e81",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },

  verificationHeroTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },

  verificationHeroText: {
    color: "#c4b5fd",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },

  verificationCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  },

  verificationLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },

  verificationInput: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#ffffff",
    padding: 14,
    borderRadius: 15,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 14,
  },

  verifyButton: {
    backgroundColor: "#7c3aed",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },

  verifyButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },

  verificationResultCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },

  verificationValid: {
    backgroundColor: "#052e16",
    borderColor: "#22c55e",
  },

  verificationInvalid: {
    backgroundColor: "#450a0a",
    borderColor: "#ef4444",
  },

  verificationStatus: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
  },

  verificationMessage: {
    color: "#e2e8f0",
    fontWeight: "800",
    marginBottom: 16,
  },

  verificationTicketBox: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 16,
  },

  verificationTicketTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },

  verificationTicketText: {
    color: "#cbd5e1",
    fontWeight: "800",
    marginBottom: 8,
  },

  verificationTicketPrice: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 8,
  },

  adminHeroCard: {
    backgroundColor: "#1e1b4b",
    borderWidth: 1,
    borderColor: "#312e81",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },

  adminHeroTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },

  adminHeroText: {
    color: "#c4b5fd",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },

  adminStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },

  adminStatCard: {
    flexGrow: 1,
    flexBasis: "22%",
    minWidth: 170,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 22,
    padding: 20,
  },

  adminStatIcon: {
    fontSize: 26,
    marginBottom: 10,
  },

  adminStatValue: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 6,
  },

  adminStatLabel: {
    color: "#94a3b8",
    fontWeight: "800",
  },

  analyticsSectionCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },

  chartCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    overflow: "hidden",
  },

  chartTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },

  chart: {
    borderRadius: 18,
  },

  adminSectionCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },

  adminSectionTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16,
  },

  popularShowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },

  popularRank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
  },

  popularRankText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  popularShowInfo: {
    flex: 1,
  },

  popularShowTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },

  popularShowTheatre: {
    color: "#94a3b8",
    fontWeight: "700",
  },

  popularShowMeta: {
    alignItems: "flex-end",
  },

  popularShowCount: {
    color: "#38bdf8",
    fontWeight: "900",
    marginBottom: 4,
  },

  popularShowRevenue: {
    color: "#22c55e",
    fontWeight: "900",
  },

  adminSectionSubtitle: {
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: -8,
    marginBottom: 12,
  },

  adminListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  adminHeaderActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },

  adminExportButton: {
    backgroundColor: "#7c3aed",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  adminExportButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },

  adminRefreshButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  adminRefreshButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },

  adminFiltersCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  adminSearchInput: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#ffffff",
    padding: 14,
    borderRadius: 15,
    fontWeight: "800",
    marginBottom: 12,
  },

  adminFilterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  adminFilterChip: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  adminFilterChipActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#c4b5fd",
  },

  adminFilterChipText: {
    color: "#cbd5e1",
    fontWeight: "900",
    fontSize: 12,
  },

  adminFilterChipTextActive: {
    color: "#ffffff",
  },

  adminClearFilterButton: {
    backgroundColor: "#334155",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  adminClearFilterText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },

  adminFilterResultText: {
    color: "#94a3b8",
    fontWeight: "800",
    fontSize: 12,
  },

  adminReservationCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  adminReservationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  adminReservationMain: {
    flex: 1,
  },

  adminReservationTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
  },

  adminReservationSub: {
    color: "#38bdf8",
    fontWeight: "800",
  },

  adminStatusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: "hidden",
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },

  adminStatusActive: {
    backgroundColor: "#16a34a",
  },

  adminStatusCancelled: {
    backgroundColor: "#dc2626",
  },

  adminReservationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },

  adminReservationText: {
    color: "#cbd5e1",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontWeight: "800",
    fontSize: 12,
  },

  adminReservationPrice: {
    color: "#22c55e",
    backgroundColor: "#052e16",
    borderWidth: 1,
    borderColor: "#16a34a",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontWeight: "900",
    fontSize: 13,
  },

  profileCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },

  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    flex: 1,
  },

  profileTextBlock: {
    flexShrink: 1,
  },

  profileRight: {
    flex: 1,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 18,
    padding: 18,
  },

  profileQuote: {
    color: "#c4b5fd",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },

  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },

  profileName: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },

  profileEmail: {
    color: "#94a3b8",
    fontWeight: "700",
    marginBottom: 10,
  },

  memberBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#312e81",
    color: "#ddd6fe",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "900",
    fontSize: 12,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    flexGrow: 1,
    flexBasis: "22%",
    minWidth: 170,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
  },

  statValue: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },

  statLabel: {
    color: "#94a3b8",
    fontWeight: "700",
  },

  profileInfoCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
  },

  profileInfoTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 14,
  },

  profileInfoText: {
    color: "#cbd5e1",
    marginBottom: 10,
    fontWeight: "700",
  },

  message: {
    backgroundColor: "#172554",
    color: "#bfdbfe",
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 14,
  },

  selectedCard: {
    backgroundColor: "#1e1b4b",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
  },

  selectedTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 5,
  },

  selectedSubtitle: {
    color: "#c4b5fd",
    fontSize: 14,
  },

  card: {
    backgroundColor: "#0f172a",
    padding: 20,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  reservationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  ticketBadge: {
    backgroundColor: "#312e81",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  ticketBadgeText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6,
  },

  location: {
    color: "#38bdf8",
    marginBottom: 10,
    fontWeight: "700",
  },

  description: {
    color: "#94a3b8",
    marginBottom: 10,
    lineHeight: 21,
  },

  priceText: {
    color: "#22c55e",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 10,
  },

  reservationFooter: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 6,
  },

  statusPill: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "800",
    fontSize: 12,
  },

  tapHint: {
    color: "#c4b5fd",
    marginTop: 12,
    fontWeight: "800",
  },

  cancelButton: {
    backgroundColor: "#dc2626",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
  },

  cancelButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  cancelledText: {
    color: "#fca5a5",
    fontWeight: "900",
    marginTop: 14,
  },

  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  infoBadge: {
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "700",
  },

  cardButton: {
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
  },

  cardButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  backButton: {
    marginBottom: 18,
  },

  backButtonText: {
    color: "#38bdf8",
    fontWeight: "900",
    fontSize: 15,
  },

  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  legendText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
  },

  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  seatButton: {
    width: 82,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#60a5fa",
  },

  seatSelected: {
    backgroundColor: "#7c3aed",
    borderColor: "#c4b5fd",
  },

  seatReserved: {
    backgroundColor: "#334155",
    borderColor: "#475569",
    opacity: 0.6,
  },

  seatLocked: {
    backgroundColor: "#ca8a04",
    borderColor: "#facc15",
    opacity: 0.75,
  },

  seatText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },

  seatPrice: {
    color: "#dbeafe",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 20,
    borderRadius: 22,
  },

  summaryTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },

  summaryText: {
    color: "#cbd5e1",
    marginBottom: 8,
    fontWeight: "700",
  },

  lockInfoText: {
    color: "#facc15",
    marginBottom: 10,
    fontWeight: "800",
    fontSize: 13,
  },

  reserveButton: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },

  disabledButton: {
    backgroundColor: "#475569",
    opacity: 0.6,
  },

  reserveButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },

  scanQrButton: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 12,
  },

  scanQrButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },


  confirmationOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  confirmationModal: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#0f172a",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 24,
    alignItems: "center",
  },

  confirmationIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#86efac",
  },

  confirmationIcon: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
  },

  confirmationTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },

  confirmationSubtitle: {
    color: "#94a3b8",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
  },

  confirmationInfoBox: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 18,
    marginBottom: 18,
  },

  confirmationCode: {
    color: "#c4b5fd",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
  },

  confirmationShowTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },

  confirmationInfoText: {
    color: "#cbd5e1",
    fontWeight: "800",
    marginBottom: 8,
  },

  confirmationTotal: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },

  confirmationPrimaryButton: {
    width: "100%",
    backgroundColor: "#7c3aed",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },

  confirmationPrimaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },

  confirmationCloseButton: {
    paddingVertical: 6,
  },

  confirmationCloseText: {
    color: "#94a3b8",
    fontWeight: "900",
  },

  scannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  scannerPanel: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 26,
    padding: 20,
  },

  scannerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  scannerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },

  scannerCloseButton: {
    backgroundColor: "#1e293b",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  scannerCloseText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    marginTop: -2,
  },

  scannerSubtitle: {
    color: "#94a3b8",
    fontWeight: "700",
    marginBottom: 16,
  },

  cameraFrame: {
    height: 320,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    position: "relative",
  },

  cameraView: {
    flex: 1,
  },

  scannerCorners: {
    position: "absolute",
    top: 26,
    left: 26,
    right: 26,
    bottom: 26,
  },

  corner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderColor: "#c4b5fd",
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  scannerHint: {
    color: "#c4b5fd",
    textAlign: "center",
    fontWeight: "800",
    marginTop: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.86)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },

  ticketModal: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#f8fafc",
    borderRadius: 28,
    padding: 22,
    maxHeight: "92%",
  },

  ticketTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  ticketTitle: {
    color: "#0f172a",
    fontSize: 21,
    fontWeight: "900",
  },

  closeButton: {
    backgroundColor: "#e2e8f0",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
    marginTop: -2,
  },

  ticketShowTitle: {
    color: "#0f172a",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 6,
  },

  ticketMuted: {
    color: "#475569",
    fontWeight: "700",
    marginBottom: 18,
  },

  qrWrapper: {
    alignItems: "center",
    marginVertical: 14,
  },

  qrBox: {
    width: 206,
    height: 206,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  ticketQrCodeText: {
    color: "#0f172a",
    fontWeight: "900",
    marginTop: 10,
    letterSpacing: 1,
  },

  ticketInfoBox: {
    backgroundColor: "#e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },

  ticketInfoText: {
    color: "#0f172a",
    fontWeight: "800",
    marginBottom: 8,
  },

  ticketTotal: {
    color: "#16a34a",
    fontWeight: "900",
    fontSize: 17,
    marginTop: 6,
  },

  ticketPdfButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  ticketPdfButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },

  ticketCancelButton: {
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 16,
  },

  ticketCancelButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  ticketCancelledText: {
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "900",
    marginTop: 16,
  },

  ticketHint: {
    color: "#64748b",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 16,
  },
});
