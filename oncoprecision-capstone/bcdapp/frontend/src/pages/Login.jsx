import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from "@mui/material";
import { BiotechRounded, LockOutlined } from "@mui/icons-material";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const { login, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    const res = await login(form);
    if (res.success) navigate("/");
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"
      sx={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #112240 100%)",
        position: "relative", overflow: "hidden",
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,188,212,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244,67,54,0.06) 0%, transparent 40%)",
        }
      }}>
      <Card sx={{ width: 420, p: 3, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
        <CardContent>
          <Box textAlign="center" mb={4}>
            <Box sx={{ display: "inline-flex", p: 2, borderRadius: "50%", background: "linear-gradient(135deg, #00bcd4, #0288d1)", mb: 2 }}>
              <BiotechRounded sx={{ fontSize: 36, color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="white" mb={0.5}>OncoPrecision</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
              Breast Cancer Detection System
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handle}>
            {[
              { label: "Username", key: "username", type: "text" },
              { label: "Password", key: "password", type: "password" },
            ].map(({ label, key, type }) => (
              <TextField key={key} fullWidth label={label} type={type} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(0,188,212,0.6)" },
                    "&.Mui-focused fieldset": { borderColor: "#00bcd4" },
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#00bcd4" },
                }}
              />
            ))}
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ mt: 1, background: "linear-gradient(90deg, #00bcd4, #0288d1)", fontWeight: 700,
                "&:hover": { background: "linear-gradient(90deg, #00acc1, #0277bd)" } }}>
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", display: "block", textAlign: "center", mt: 3 }}>
            Clinical use only · Protected under HIPAA guidelines
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
