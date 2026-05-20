import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import axios from "axios";

export default function LoginScreen() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setMessage("Logging in...");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      setMessage(`Login successful. Welcome ${response.data.user.name}`);
      console.log("LOGIN RESPONSE:", response.data);
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      setMessage("Login failed. Check backend server or credentials.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  message: {
    color: "#22c55e",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 18,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});