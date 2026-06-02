import { create } from "zustand";
import { authAPI } from "../services/api";
import { jwtDecode } from "jwt-decode";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const d = jwtDecode(token);
        if (d.exp > Date.now() / 1000) set({ user: d, isAuthenticated: true });
        else localStorage.clear();
      } catch { localStorage.clear(); }
    }
  },

  login: async (creds) => {
    set({ loading: true, error: null });
    try {
      const r = await authAPI.login(creds);
      localStorage.setItem("access_token", r.data.access);
      localStorage.setItem("refresh_token", r.data.refresh);
      set({ user: jwtDecode(r.data.access), isAuthenticated: true, loading: false });
      return { success: true };
    } catch (e) {
      set({ error: e.response?.data?.detail || "Login failed", loading: false });
      return { success: false };
    }
  },

  logout: () => { localStorage.clear(); set({ user: null, isAuthenticated: false }); },
}));

export default useAuthStore;
