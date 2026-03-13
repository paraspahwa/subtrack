import { Platform } from "react-native";

// Resolve the correct API base URL for the current environment.
// • iOS Simulator    → localhost resolves correctly
// • Android Emulator → 10.0.2.2 maps to host machine's localhost
// • Physical device  → set EXPO_PUBLIC_API_URL in .env (e.g. http://192.168.1.x:8000)
// • Production       → set EXPO_PUBLIC_API_URL to your deployed API URL

const PRODUCTION_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.subtrack.app";

const DEV_URL = Platform.OS === "android"
  ? "http://10.0.2.2:8000"   // Android emulator → host loopback
  : "http://localhost:8000"; // iOS simulator + web

const API_URL = __DEV__ ? DEV_URL : PRODUCTION_URL;

export default API_URL;

// 💡 To test on a physical device:
//   Create frontend/.env and add:
//   EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000
//   Find your IP: ifconfig | grep 'inet ' (Mac/Linux) or ipconfig (Windows)
