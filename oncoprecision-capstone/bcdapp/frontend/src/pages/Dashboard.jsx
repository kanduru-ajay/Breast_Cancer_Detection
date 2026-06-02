import React, { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, LinearProgress,
} from "@mui/material";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Biotech, CheckCircle, Science, WarningAmber } from "@mui/icons-material";
import { datasetAPI, modelAPI, predictionAPI } from "../services/api";

const COLORS = { malignant: "#ef5350", benign: "#26a69a" };

const StatCard = ({ title, value, sub, icon, accent }) => (
  <Card sx={{ background: `linear-gradient(135deg, ${accent}18 0%, transparent 100%)`, border: `1px solid ${accent}30`, height: "100%" }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={1}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={800} color={accent} mt={0.5}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        </Box>
        <Box sx={{ color: accent, opacity: 0.7, mt: 0.5 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const MetricBar = ({ label, value, color }) => (
  <Box mb={1.5}>
    <Box display="flex" justifyContent="space-between" mb={0.5}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="caption" fontWeight={700} color={color}>{(value * 100).toFixed(1)}%</Typography>
    </Box>
    <LinearProgress variant="determinate" value={value * 100}
      sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover",
        "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
  </Box>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ datasets: 0, models: 0, predictions: 0, malignant: 0, benign: 0 });
  const [bestModel, setBestModel] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ds, ms, ps] = await Promise.all([
          datasetAPI.list(), modelAPI.list(), predictionAPI.list(),
        ]);
        const preds = ps.data.results || ps.data || [];
        const modelList = ms.data.results || ms.data || [];
        const mal = preds.filter((p) => p.result === "malignant").length;
        setStats({
          datasets: (ds.data.results || ds.data || []).length,
          models: modelList.length,
          predictions: preds.length,
          malignant: mal,
          benign: preds.length - mal,
        });
        setModels(modelList);
        const best = modelList.find((m) => m.is_best);
        if (best) setBestModel(best);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
      <CircularProgress size={48} sx={{ color: "#00bcd4" }} />
    </Box>
  );

  const radarData = bestModel ? [
    { metric: "Accuracy", value: (bestModel.accuracy || 0) * 100 },
    { metric: "Precision", value: (bestModel.precision || 0) * 100 },
    { metric: "Recall", value: (bestModel.recall || 0) * 100 },
    { metric: "F1 Score", value: (bestModel.f1_score || 0) * 100 },
    { metric: "ROC-AUC", value: (bestModel.roc_auc || 0) * 100 },
    { metric: "Specificity", value: (bestModel.specificity || 0) * 100 },
  ] : [];

  const pieData = [
    { name: "Malignant", value: stats.malignant },
    { name: "Benign", value: stats.benign },
  ];

  const barData = models.filter((m) => m.f1_score).map((m) => ({
    name: m.algorithm.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    F1: parseFloat((m.f1_score * 100).toFixed(1)),
    Accuracy: parseFloat((m.accuracy * 100).toFixed(1)),
    "ROC-AUC": parseFloat((m.roc_auc * 100).toFixed(1)),
  }));

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800} color="white">Clinical Dashboard</Typography>
        <Typography color="rgba(255,255,255,0.4)" variant="body2">
          Breast cancer classification · ML-powered diagnostic support
        </Typography>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: "Datasets", value: stats.datasets, sub: "CSV uploaded", icon: <Science />, accent: "#00bcd4" },
          { title: "Models Trained", value: stats.models, sub: "LR · SVM · RF · XGB", icon: <Biotech />, accent: "#7c4dff" },
          { title: "Malignant", value: stats.malignant, sub: "Positive diagnoses", icon: <WarningAmber />, accent: "#ef5350" },
          { title: "Benign", value: stats.benign, sub: "Negative diagnoses", icon: <CheckCircle />, accent: "#26a69a" },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.title}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Best Model Metrics */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700} color="white">Best Model</Typography>
                {bestModel && <Chip label="⭐ Best" size="small" sx={{ bgcolor: "#7c4dff22", color: "#7c4dff", border: "1px solid #7c4dff44" }} />}
              </Box>
              {bestModel ? (
                <>
                  <Typography variant="body2" color="rgba(255,255,255,0.5)" mb={2}>
                    {bestModel.algorithm?.replace(/_/g, " ").toUpperCase()}
                  </Typography>
                  {[
                    { label: "Accuracy", value: bestModel.accuracy, color: "#00bcd4" },
                    { label: "Precision", value: bestModel.precision, color: "#7c4dff" },
                    { label: "Recall (Sensitivity)", value: bestModel.recall, color: "#ef5350" },
                    { label: "F1 Score", value: bestModel.f1_score, color: "#26a69a" },
                    { label: "ROC-AUC", value: bestModel.roc_auc, color: "#ff9800" },
                    { label: "Specificity", value: bestModel.specificity, color: "#78909c" },
                  ].map((m) => <MetricBar key={m.label} {...m} />)}
                </>
              ) : (
                <Typography color="rgba(255,255,255,0.3)" variant="body2">
                  Train models to see metrics here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Radar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} color="white" mb={1}>Performance Radar</Typography>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                    <Radar dataKey="value" stroke="#00bcd4" fill="#00bcd4" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box height={260} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="rgba(255,255,255,0.3)" variant="body2">No model data</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} color="white" mb={1}>Prediction Distribution</Typography>
              {stats.predictions > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={i === 0 ? "#ef5350" : "#26a69a"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "#1a2744", border: "none", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box height={200} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="rgba(255,255,255,0.3)" variant="body2">No predictions yet</Typography>
                </Box>
              )}
              <Box display="flex" gap={2} justifyContent="center">
                {[{ label: "Malignant", color: "#ef5350" }, { label: "Benign", color: "#26a69a" }].map((l) => (
                  <Box key={l.label} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: l.color }} />
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Model Comparison Bar */}
        {barData.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="white" mb={2}>Model Comparison (%)</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <YAxis domain={[85, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#1a2744", border: "none", borderRadius: 8, color: "white" }} />
                    <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)" }} />
                    <Bar dataKey="Accuracy" fill="#00bcd4" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="F1" fill="#7c4dff" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ROC-AUC" fill="#ef5350" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
