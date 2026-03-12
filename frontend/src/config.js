// Update API_URL for your environment:
//   iOS Simulator:    http://localhost:8000
//   Android Emulator: http://10.0.2.2:8000
//   Physical device:  http://<your-local-ip>:8000
//   Production:       https://your-api.yourdomain.com

const API_URL = __DEV__
  ? "http://10.0.2.2:8000"   // Android emulator default; change for iOS
  : "https://api.subtrack.app";

export default API_URL;
