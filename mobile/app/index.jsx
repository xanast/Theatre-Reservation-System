import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../src/screens/LoginScreen";
import HomeScreen from "../src/screens/HomeScreen";

export default function App() {
  const [authData, setAuthData] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");

  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedAuthData = await AsyncStorage.getItem("theatre_auth_data");

      if (savedAuthData) {
        setAuthData(JSON.parse(savedAuthData));
      } else {
        const expiredFlag = await AsyncStorage.getItem(
          "theatre_session_expired"
        );

        if (expiredFlag === "true") {
          setSessionExpiredMessage(
            "Η συνεδρία έληξε. Κάνε ξανά σύνδεση."
          );

          await AsyncStorage.removeItem("theatre_session_expired");
        }
      }
    } catch (error) {
      console.log("Σφάλμα φόρτωσης αποθηκευμένης σύνδεσης:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (data) => {
    try {
      await AsyncStorage.setItem("theatre_auth_data", JSON.stringify(data));

      setSessionExpiredMessage("");
      setAuthData(data);
    } catch (error) {
      console.log("Σφάλμα αποθήκευσης σύνδεσης:", error);
      setAuthData(data);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("theatre_auth_data");
    } catch (error) {
      console.log("Σφάλμα αποσύνδεσης:", error);
    } finally {
      setAuthData(null);
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Φόρτωση εφαρμογής...</Text>
      </View>
    );
  }

  if (!authData) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    );
  }

  return (
    <HomeScreen
      user={authData.user}
      token={authData.token}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#cbd5e1",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 16,
  },
});
