import { createClient } from "@insforge/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { INSFORGE_CONFIG } from "./config";

// Initialize InsForge Client
export const insforge = createClient({
  baseUrl: INSFORGE_CONFIG.baseUrl,
  anonKey: INSFORGE_CONFIG.anonKey,
});

// Helper to handle SDK responses
const handle = async (promise) => {
  const { data, error } = await promise;
  if (error) {
    console.error("SDK Error:", error);
    throw new Error(error.message || "Request failed");
  }
  return data;
};

const mapLegacyAuth = (data) => {
  if (!data?.user) return data;
  return {
    access_token: data.accessToken,
    user_id: data.user.id,
    email: data.user.email,
    full_name: data.user.user_metadata?.name || "",
    plan: data.user.user_metadata?.plan || "free",
    requireEmailVerification: data.requireEmailVerification,
  };
};

export const api = {
  // Auth
  register: async ({ email, password, full_name }) => {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: full_name,
    });
    if (error) throw error;
    return mapLegacyAuth(data);
  },
  
  verifyEmail: async (email, otp) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) throw error;
    return mapLegacyAuth(data);
  },

  resendVerification: (email) => handle(insforge.auth.resendVerificationEmail({ email })),

  login: async ({ email, password }) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return mapLegacyAuth(data);
  },

  me: async () => {
    const userData = await handle(insforge.auth.getCurrentUser());
    const profileData = await handle(insforge.database.from("profiles").select("*").eq("id", userData.user.id).single());
    return { ...userData.user, ...profileData, full_name: profileData.full_name };
  },

  updateMe: async (body) => {
    const { data: sessionData, error } = await insforge.auth.getCurrentSession();
    if (error || !sessionData?.session?.user?.id) throw error || new Error("No active session");
    return handle(insforge.database.from("profiles").update(body).eq("id", sessionData.session.user.id));
  },

  forgotPassword: (email) => handle(insforge.auth.sendResetPasswordEmail({ email })),
  
  resetPassword: (token, pwd) => handle(insforge.auth.resetPassword({ newPassword: pwd, otp: token })),

  deleteAccount: () => handle(insforge.auth.signOut()),

  // Subscriptions
  listSubs: () => handle(insforge.database.from("subscriptions").select("*").order("next_billing_date", { ascending: true })),
  
  createSub: async (body) => {
    const { data: sessionData, error } = await insforge.auth.getCurrentSession();
    if (error || !sessionData?.session?.user?.id) throw error || new Error("No active session");
    const userId = sessionData.session.user.id;
    return handle(insforge.database.from("subscriptions").insert([{ ...body, user_id: userId }]).select().single());
  },
  
  updateSub: (id, b) => handle(insforge.database.from("subscriptions").update(b).eq("id", id).select().single()),
  
  deleteSub: (id) => handle(insforge.database.from("subscriptions").delete().eq("id", id)),

  // Analytics (Edge Functions)
  analytics: () => handle(insforge.functions.invoke("getanalytics")),
  
  reminderCandidates: (days = 30) => {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + days);
    return handle(insforge.database.from("subscriptions")
      .select("*")
      .gte("next_billing_date", new Date().toISOString())
      .lte("next_billing_date", horizon.toISOString()));
  },

  actionCenterRisk: (days = 30) => api.reminderCandidates(days),

  priceAnomalies: () => handle(insforge.database.from("subscriptions").select("*").eq("amount_alert_dismissed", false).not("amount_change_pct", "is", null)),

  dismissAmountAlert: (id) => handle(insforge.database.from("subscriptions").update({ amount_alert_dismissed: true }).eq("id", id)),

  setCancellationOutcome: (id, outcome) => handle(insforge.database.from("subscriptions").update({ 
    cancellation_outcome: outcome,
    cancellation_outcome_at: new Date().toISOString()
  }).eq("id", id)),

  // Discovery
  discoveryMailbox: () => handle(insforge.database.from("mailbox_connections").select("*")),
  
  connectDiscoveryMailbox: async (provider, email) => {
    const { data: sessionData, error } = await insforge.auth.getCurrentSession();
    if (error || !sessionData?.session?.user?.id) throw error || new Error("No active session");
    const userId = sessionData.session.user.id;
    return handle(insforge.database.from("mailbox_connections").insert([{ provider, email, user_id: userId }]));
  },
  
  disconnectDiscoveryMailbox: async () => {
    const { data: sessionData, error } = await insforge.auth.getCurrentSession();
    if (error || !sessionData?.session?.user?.id) throw error || new Error("No active session");
    return handle(insforge.database.from("mailbox_connections").delete().eq("user_id", sessionData.session.user.id));
  },

  discoveryCandidates: (status = "pending") => handle(insforge.database.from("discovery_candidates").select("*").eq("status", status)),

  acceptDiscoveryCandidate: (id) => handle(insforge.functions.invoke("accept-candidate", { body: { id } })), 
  
  rejectDiscoveryCandidate: (id) => handle(insforge.database.from("discovery_candidates").update({ status: "rejected" }).eq("id", id)),

  // Payments (Edge Functions)
  createOrder: (body) => handle(insforge.functions.invoke("razorpay-order", { body })),
  
  verifyPayment: (body) => handle(insforge.functions.invoke("razorpay-verify", { body })),
};
