import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("access_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const r = await axios.post(`${BASE}/auth/token/refresh/`, { refresh });
          localStorage.setItem("access_token", r.data.access);
          err.config.headers.Authorization = `Bearer ${r.data.access}`;
          return api(err.config);
        } catch { localStorage.clear(); window.location.href = "/login"; }
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post("/auth/register/", d),
  login: (d) => api.post("/auth/login/", d),
  profile: () => api.get("/auth/profile/"),
};

export const datasetAPI = {
  list: () => api.get("/datasets/"),
  upload: (fd) => api.post("/datasets/upload/", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  detail: (id) => api.get(`/datasets/${id}/`),
  delete: (id) => api.delete(`/datasets/${id}/`),
};

export const modelAPI = {
  list: (p) => api.get("/models/", { params: p }),
  train: (d) => api.post("/models/train/", d),
  detail: (id) => api.get(`/models/${id}/`),
  best: (dsId) => api.get(`/models/best/${dsId}/`),
  delete: (id) => api.delete(`/models/${id}/`),
};

export const predictionAPI = {
  list: (p) => api.get("/predictions/", { params: p }),
  predict: (d) => api.post("/predictions/predict/", d),
  detail: (id) => api.get(`/predictions/${id}/`),
};

export default api;
