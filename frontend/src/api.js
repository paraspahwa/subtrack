import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "./config";

async function getToken() {
  return AsyncStorage.getItem("st_token");
}

async function authHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // Auth
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:    (body) => request("/api/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  me:       ()     => request("/api/auth/me"),
  forgotPassword: (email)        => request("/api/auth/forgot-password",  { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword:  (token, pwd)   => request("/api/auth/reset-password",   { method: "POST", body: JSON.stringify({ token, new_password: pwd }) }),
  deleteAccount:  ()             => request("/api/auth/account",           { method: "DELETE" }),

  // Subscriptions
  listSubs:   ()       => request("/api/subscriptions"),
  createSub:  (body)   => request("/api/subscriptions",      { method: "POST", body: JSON.stringify(body) }),
  updateSub:  (id, b)  => request(`/api/subscriptions/${id}`,{ method: "PUT",  body: JSON.stringify(b)    }),
  deleteSub:  (id)     => request(`/api/subscriptions/${id}`,{ method: "DELETE" }).catch(() => null),

  // Analytics
  analytics: () => request("/api/analytics"),
  reminderCandidates: (days = 30) => request(`/api/reminders/upcoming?days=${days}`),
  actionCenterRisk: (days = 30, limit = 20) => request(`/api/action-center/renewal-risk?days=${days}&limit=${limit}`),
  setCancellationOutcome: (id, outcome) => request(`/api/subscriptions/${id}/cancellation-outcome`, {
    method: "POST",
    body: JSON.stringify({ outcome }),
  }),

  // Export
  exportCsvUrl: () => `${API_URL}/api/subscriptions/export.csv`,

  // Payments
  createOrder:  (body) => request("/api/payments/create-order", { method: "POST", body: JSON.stringify(body) }),
  verifyPayment:(body) => request("/api/payments/verify",        { method: "POST", body: JSON.stringify(body) }),
};
