import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, AppBar, Typography, IconButton, Avatar, Divider, CssBaseline,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Dashboard, CloudUpload, Psychology, BiotechRounded,
  History, Logout,
} from "@mui/icons-material";
import useAuthStore from "./store/authStore";
import DashboardPage from "./pages/Dashboard";
import UploadPage from "./pages/Upload";
import TrainPage from "./pages/Train";
import PredictPage from "./pages/Predict";
import HistoryPage from "./pages/History";
import LoginPage from "./pages/Login";

const DW = 240;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    secondary: { main: "#7c4dff" },
    background: { default: "#0a1628", paper: "#0d1f3c" },
    error: { main: "#ef5350" },
    success: { main: "#26a69a" },
  },
  typography: { fontFamily: "'Syne', 'DM Sans', sans-serif" },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});

const NAV = [
  { path: "/", label: "Dashboard", icon: <Dashboard /> },
  { path: "/upload", label: "Upload Data", icon: <CloudUpload /> },
  { path: "/train", label: "Train Models", icon: <Psychology /> },
  { path: "/predict", label: "Predict", icon: <BiotechRounded /> },
  { path: "/history", label: "History", icon: <History /> },
];

function Sidebar() {
  const { logout, user } = useAuthStore();
  const loc = useLocation();
  return (
    <Drawer variant="permanent" sx={{
      width: DW,
      "& .MuiDrawer-paper": {
        width: DW,
        background: "linear-gradient(180deg, #060f1e 0%, #0a1628 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      },
    }}>
      <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, background: "linear-gradient(135deg, #00bcd4, #0288d1)" }}>
            <BiotechRounded sx={{ fontSize: 20, color: "white" }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="white" lineHeight={1.2}>OncoPrecision</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Cancer Detection AI</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        <List dense>
          {NAV.map(({ path, label, icon }) => {
            const active = loc.pathname === path;
            return (
              <ListItem key={path} disablePadding sx={{ px: 1, mb: 0.5 }}>
                <ListItemButton component={Link} to={path}
                  sx={{
                    borderRadius: 1.5, py: 1,
                    bgcolor: active ? "rgba(0,188,212,0.12)" : "transparent",
                    borderLeft: active ? "2px solid #00bcd4" : "2px solid transparent",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    transition: "all 0.15s",
                  }}>
                  <ListItemIcon sx={{ color: active ? "#00bcd4" : "rgba(255,255,255,0.35)", minWidth: 36 }}>{icon}</ListItemIcon>
                  <ListItemText primary={label}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? "#00bcd4" : "rgba(255,255,255,0.6)" }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "#00bcd422", color: "#00bcd4", fontSize: 13, fontWeight: 700 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="white" fontWeight={600} display="block" noWrap>{user?.username}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{user?.role}</Typography>
          </Box>
          <IconButton size="small" onClick={logout} sx={{ color: "rgba(255,255,255,0.3)" }}><Logout fontSize="small" /></IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}

function Layout({ children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, p: 3.5, bgcolor: "background.default", overflow: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, init } = useAuthStore();
  useEffect(() => { init(); }, []);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path="/train" element={<PrivateRoute><TrainPage /></PrivateRoute>} />
          <Route path="/predict" element={<PrivateRoute><PredictPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
