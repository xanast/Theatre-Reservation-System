import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      try {
        await AsyncStorage.removeItem("theatre_auth_data");
        await AsyncStorage.setItem("theatre_session_expired", "true");
      } catch (storageError) {
        console.log("Auto logout storage error:", storageError);
      }

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
