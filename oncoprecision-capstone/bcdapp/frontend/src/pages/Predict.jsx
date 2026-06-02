import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
  Grid, Chip, Divider, LinearProgress, Tooltip,
} from "@mui/material";
import { BiotechRounded, Warning, CheckCircle, InfoOutlined } from "@mui/icons-material";
import { modelAPI, predictionAPI } from "../services/api";

// Default WDBC features with descriptions
const WDBC_FEATURES = [
  { key: "radius_mean", label: "Radius Mean", desc: "Mean of distances from center to perimeter", group: "Mean" },
  { key: "texture_mean", label: "Texture Mean", desc: "Standard deviation of gray-scale values", group: "Mean" },
  { key: "perimeter_mean", label: "Perimeter Mean", desc: "Mean perimeter of cell nuclei", group: "Mean" },
  { key: "area_mean", label: "Area Mean", desc: "Mean area of cell nuclei", group: "Mean" },
  { key: "smoothness_mean", label: "Smoothness Mean", desc: "Local variation in radius lengths", group: "Mean" },
  { key: "compactness_mean", label: "Compactness Mean", desc: "Perimeter² / area - 1.0", group: "Mean" },
  { key: "concavity_mean", label: "Concavity Mean", desc: "Severity of concave portions of contour", group: "Mean" },
  { key: "concave_points_mean", label: "Concave Points Mean", desc: "Number of concave portions", group: "Mean" },
  { key: "symmetry_mean", label: "Symmetry Mean", desc: "Symmetry measure", group: "Mean" },
  { key: "fractal_dimension_mean", label: "Fractal Dim. Mean", desc: "Coastline approximation - 1", group: "Mean" },
  { key: "radius_se", label: "Radius SE", desc: "Standard error of radius", group: "SE" },
  { key: "texture_se", label: "Texture SE", desc: "Standard error of texture", group: "SE" },
  { key: "perimeter_se", label: "Perimeter SE", desc: "Standard error of perimeter", group: "SE" },
  { key: "area_se", label: "Area SE", desc: "Standard error of area", group: "SE" },
  { key: "radius_worst", label: "Radius Worst", desc: "Largest mean of radius", group: "Worst" },
  { key: "texture_worst", label: "Texture Worst", desc: "Largest mean of texture", group: "Worst" },
  { key: "perimeter_worst", label: "Perimeter Worst", desc: "Largest mean of perimeter", group: "Worst" },
  { key: "area_worst", label: "Area Worst", desc: "Largest mean of area", group: "Worst" },
  { key: "concavity_worst", label: "Concavity Worst", desc: "Largest mean of concavity", group: "Worst" },
  { key: "concave_points_worst", label: "Concave Points Worst", desc: "Largest mean of concave points", group: "Worst" },
];

const SAMPLE_MALIGNANT = { radius_mean: 17.99, texture_mean: 10.38, perimeter_mean: 122.8, area_mean: 1001, smoothness_mean: 0.1184, compactness_mean: 0.2776, concavity_mean: 0.3001, concave_points_mean: 0.1471, symmetry_mean: 0.2419, fractal_dimension_mean: 0.07871, radius_se: 1.095, texture_se: 0.9053, perimeter_se: 8.589, area_se: 153.4, radius_worst: 25.38, texture_worst: 17.33, perimeter_worst: 184.6, area_worst: 2019, concavity_worst: 0.7119, concave_points_worst: 0.2654 };
const SAMPLE_BENIGN = { radius_mean: 12.32, texture_mean: 12.39, perimeter_mean: 78.85, area_mean: 464.1, smoothness_mean: 0.1028, compactness_mean: 0.06981, concavity_mean: 0.03987, concave_points_mean: 0.037, symmetry_mean: 0.1959, fractal_dimension_mean: 0.05955, radius_se: 0.3821, texture_se: 1.044, perimeter_se: 2.497, area_se: 30.25, radius_worst: 13.5, texture_worst: 15.64, perimeter_worst: 86.97, area_worst: 549.1, concavity_worst: 0.1374, concave_points_worst: 0.06832 };

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white", fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(0,188,212,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#00bcd4" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "#00bcd4" },
};

export default function Predict() {
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    modelAPI.list().then((r) => {
      const ms = r.data.results || r.data;
      setModels(ms);
      const best = ms.find((m) => m.is_best);
      if (best) setModelId(best.id);
    });
  }, []);

  const setFeat = (k, v) => setFeatures((p) => ({ ...p, [k]: parseFloat(v) || 0 }));
  const loadSample = (sample) => setFeatures({ ...sample });

  const handlePredict = async () => {
    if (!modelId) { setError("Select a model"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await predictionAPI.predict({ model_id: modelId, patient_id: patientId, features });
      setResult(r.data);
    } catch (e) { setError(e.response?.data?.error || "Prediction failed"); }
    finally { setLoading(false); }
  };

  const groups = [...new Set(WDBC_FEATURES.map((f) => f.group))];

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} color="white" mb={0.5}>Patient Prediction</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.4)" }} mb={3}>
        Enter cytology measurements to classify as benign or malignant
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="white" mb={2}>Model & Patient</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Classifier Model</InputLabel>
                <Select value={modelId} onChange={(e) => setModelId(e.target.value)} label="Classifier Model"
                  sx={{ color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" } }}>
                  {models.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.algorithm?.replace(/_/g, " ")} {m.is_best ? "⭐" : ""}
                      {m.f1_score ? ` (F1: ${(m.f1_score * 100).toFixed(1)}%)` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth label="Patient ID (optional)" value={patientId}
                onChange={(e) => setPatientId(e.target.value)} sx={{ ...inputSx, mb: 2 }} />
              <Box display="flex" gap={1}>
                <Button size="small" variant="outlined"
                  onClick={() => loadSample(SAMPLE_MALIGNANT)}
                  sx={{ color: "#ef5350", borderColor: "#ef535044", fontSize: 11 }}>
                  Load Malignant Sample
                </Button>
                <Button size="small" variant="outlined"
                  onClick={() => loadSample(SAMPLE_BENIGN)}
                  sx={{ color: "#26a69a", borderColor: "#26a69a44", fontSize: 11 }}>
                  Load Benign Sample
                </Button>
              </Box>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button fullWidth variant="contained" size="large" onClick={handlePredict} disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BiotechRounded />}
            sx={{ background: "linear-gradient(90deg, #00bcd4, #0288d1)", fontWeight: 700, mb: 2 }}>
            {loading ? "Classifying..." : "Run Classification"}
          </Button>

          {result && <ResultCard result={result} />}
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="white" mb={2}>Feature Inputs</Typography>
              {groups.map((group) => (
                <Box key={group} mb={2}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>{group} Features</Typography>
                  <Grid container spacing={1.5} mt={0}>
                    {WDBC_FEATURES.filter((f) => f.group === group).map((f) => (
                      <Grid item xs={6} key={f.key}>
                        <Tooltip title={f.desc} placement="top">
                          <TextField fullWidth label={f.label} type="number"
                            value={features[f.key] ?? ""}
                            onChange={(e) => setFeat(f.key, e.target.value)}
                            sx={inputSx} size="small" />
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function ResultCard({ result }) {
  const malignant = result.result === "malignant";
  const accent = malignant ? "#ef5350" : "#26a69a";

  return (
    <Card sx={{ border: `1px solid ${accent}44`, background: `rgba(${malignant ? "239,83,80" : "38,166,154"},0.06)`, borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          {malignant ? <Warning sx={{ color: "#ef5350", fontSize: 28 }} /> : <CheckCircle sx={{ color: "#26a69a", fontSize: 28 }} />}
          <Box>
            <Typography variant="h5" fontWeight={800} color={accent} textTransform="uppercase">{result.result}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Malignant</Typography>
            <Typography variant="caption" sx={{ color: "#ef5350" }}>{(result.malignant_prob * 100).toFixed(1)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={result.malignant_prob * 100}
            sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)",
              "& .MuiLinearProgress-bar": { bgcolor: "#ef5350", borderRadius: 4 } }} />
          <Box display="flex" justifyContent="space-between" mt={1} mb={0.5}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">Benign</Typography>
            <Typography variant="caption" sx={{ color: "#26a69a" }}>{(result.benign_prob * 100).toFixed(1)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={result.benign_prob * 100}
            sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)",
              "& .MuiLinearProgress-bar": { bgcolor: "#26a69a", borderRadius: 4 } }} />
        </Box>

        {result.top_features?.length > 0 && (
          <>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
              Top Contributing Features
            </Typography>
            {result.top_features.slice(0, 5).map((f, i) => (
              <Box key={i} mt={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">{f.feature.replace(/_/g, " ")}</Typography>
                  <Chip label={f.direction === "increases_risk" ? "↑ Risk" : "↓ Risk"} size="small"
                    sx={{ fontSize: 10, height: 18,
                      bgcolor: f.direction === "increases_risk" ? "rgba(239,83,80,0.15)" : "rgba(38,166,154,0.15)",
                      color: f.direction === "increases_risk" ? "#ef5350" : "#26a69a" }} />
                </Box>
                <LinearProgress variant="determinate" value={Math.min(f.importance * 100, 100)}
                  sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: "rgba(255,255,255,0.05)",
                    "& .MuiLinearProgress-bar": { bgcolor: f.direction === "increases_risk" ? "#ef5350" : "#26a69a", borderRadius: 2 } }} />
              </Box>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
