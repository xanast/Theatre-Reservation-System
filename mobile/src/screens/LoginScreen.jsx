import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import api from "../services/api";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const handleLogin = async () => {
    try {
      setLoading(true);
      setMessage("Γίνεται σύνδεση...");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      setMessage(`Επιτυχής σύνδεση. Καλώς ήρθες ${response.data.user.name}`);
      onLogin(response.data);
    } catch (error) {
      console.log("Login error:", error);
      setMessage("Αποτυχία σύνδεσης. Έλεγξε τα στοιχεία ή τον server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      if (!name || !email || !password) {
        setMessage("Συμπλήρωσε όνομα, email και κωδικό.");
        return;
      }

      setLoading(true);
      setMessage("Γίνεται δημιουργία λογαριασμού...");

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      setMessage("Ο λογαριασμός δημιουργήθηκε. Γίνεται σύνδεση...");

      const loginResponse = await api.post("/auth/login", {
        email,
        password,
      });

      onLogin(loginResponse.data);
    } catch (error) {
      console.log("Register error:", error);

      const backendMessage = error?.response?.data?.message;

      if (backendMessage) {
        setMessage(backendMessage);
      } else {
        setMessage("Αποτυχία εγγραφής. Δοκίμασε διαφορετικό email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const switchMode = () => {
    setMessage("");
    setMode(isLogin ? "register" : "login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🎭</Text>

        <Text style={styles.title}>Κρατήσεις Θεάτρου</Text>

        <Text style={styles.subtitle}>
          {isLogin
            ? "Συνδέσου για να διαχειριστείς τις κρατήσεις σου"
            : "Δημιούργησε λογαριασμό για να κάνεις κρατήσεις"}
        </Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => {
              setMode("login");
              setMessage("");
            }}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
              Σύνδεση
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => {
              setMode("register");
              setMessage("");
            }}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
              Εγγραφή
            </Text>
          </TouchableOpacity>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {!isLogin ? (
          <TextInput
            style={styles.input}
            placeholder="Ονοματεπώνυμο"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Κωδικός"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Παρακαλώ περίμενε..."
              : isLogin
              ? "Σύνδεση"
              : "Δημιουργία Λογαριασμού"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={switchMode}>
          <Text style={styles.switchText}>
            {isLogin
              ? "Δεν έχεις λογαριασμό; Κάνε εγγραφή"
              : "Έχεις ήδη λογαριασμό; Σύνδεση"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 28,
    padding: 24,
  },

  logo: {
    fontSize: 58,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "#7c3aed",
  },

  tabText: {
    color: "#94a3b8",
    fontWeight: "900",
  },

  activeTabText: {
    color: "#ffffff",
  },

  message: {
    backgroundColor: "#172554",
    color: "#bfdbfe",
    padding: 13,
    borderRadius: 14,
    marginBottom: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  input: {
    backgroundColor: "#020617",
    color: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#7c3aed",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },

  disabledButton: {
    backgroundColor: "#475569",
    opacity: 0.7,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },

  switchText: {
    color: "#38bdf8",
    textAlign: "center",
    fontWeight: "900",
    marginTop: 18,
  },
});
