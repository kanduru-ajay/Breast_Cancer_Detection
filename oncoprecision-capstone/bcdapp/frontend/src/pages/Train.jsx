import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, FormGroup, FormControlLabel, Checkbox,
  Select, MenuItem, FormControl, InputLabel, Button, Alert, CircularProgress,
  Grid, Table, TableBody, TableCell, TableHead, TableRow, Chip, Switch,
  LinearProgress,
} from "@mui/material";
import { Psychology, EmojiEvents, CheckCircle, Error as ErrIcon } from "@mui/icons-material";
import { datasetAPI, modelAPI } from "../services/api";

const ALGORITHMS = [
  { key: "logistic_regression", label: "Logistic Regression", desc: "Fast, interpretable baseline" },
  { key: "svm", label: "Support Vector Machine", desc: "Optimal margin classification" },
  { key: "random_forest", label: "Random Forest", desc: "Ensemble tree classifier" },
  { key: "xgboost", label: "XGBoost", desc: "Gradient-boosted trees" },
];

const cellSx = { color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.06)", fontSize: 13 };
const headSx = { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.06)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 };

export default function Train() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [algos, setAlgos] = useState(["logistic_regression", "random_forest", "xgboost"]);
  const [target, setTarget] = useState("diagnosis");
  const [featureSelection, setFeatureSelection] = useState(true);
  const [nFeatures, setNFeatures] = useState(20);
  const [handleImbalance, setHandleImbalance] = useState(true);
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    datasetAPI.list().then((r) => {
      const ready = (r.data.results || r.data).filter((d) => d.status === "ready");
      setDatasets(ready);
      if (ready.length) setDatasetId(ready[0].id);
    });
  }, []);

  const toggle = (a) => setAlgos((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);

  const handleTrain = async () => {
    if (!datasetId || !algos.length) { setError("Select a dataset and at least one algorithm"); return; }
    setTraining(true); setError(""); setResults([]);
    try {
      const r = await modelAPI.train({
        dataset_id: datasetId, algorithms: algos,
        target_column: target, feature_selection: featureSelection,
        n_features: nFeatures, handle_imbalance: handleImbalance,
      });
      setResults(r.data.results || r.data);
    } catch (e) { setError(e.response?.data?.error || "Training failed"); }
    finally { setTraining(false); }
  };

  const pct = (v) => v != null ? `${(v * 100).toFixed(2)}%` : "—";

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} color="white" mb={0.5}>Train Models</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.4)" }} mb={3}>
        Stratified K-Fold CV · SMOTE imbalance handling · Feature selection · Auto best-model
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} color="white" mb={2}>Configuration</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Dataset</InputLabel>
                <Select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} label="Dataset"
                  sx={{ color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" } }}>
                  {datasets.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>

              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>Algorithms</Typography>
              <FormGroup sx={{ mb: 2, mt: 0.5 }}>
                {ALGORITHMS.map((a) => (
                  <FormControlLabel key={a.key}
                    control={<Checkbox checked={algos.includes(a.key)} onChange={() => toggle(a.key)}
                      sx={{ color: "rgba(255,255,255,0.3)", "&.Mui-checked": { color: "#00bcd4" } }} />}
                    label={
                      <Box>
                        <Typography variant="body2" color="white">{a.label}</Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>{a.desc}</Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="rgba(255,255,255,0.6)">Feature Selection</Typography>
                <Switch checked={featureSelection} onChange={(e) => setFeatureSelection(e.target.checked)}
                  sx={{ "& .Mui-checked .MuiSwitch-thumb": { color: "#00bcd4" } }} />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="rgba(255,255,255,0.6)">SMOTE (Imbalance)</Typography>
                <Switch checked={handleImbalance} onChange={(e) => setHandleImbalance(e.target.checked)}
                  sx={{ "& .Mui-checked .MuiSwitch-thumb": { color: "#00bcd4" } }} />
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Button fullWidth variant="contained" size="large" onClick={handleTrain} disabled={training}
                startIcon={training ? <CircularProgress size={18} color="inherit" /> : <Psychology />}
                sx={{ background: "linear-gradient(90deg, #7c4dff, #512da8)", fontWeight: 700,
                  "&:hover": { background: "linear-gradient(90deg, #651fff, #4527a0)" } }}>
                {training ? "Training..." : "Train All Models"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {training && (
            <Card sx={{ mb: 2, background: "rgba(124,77,255,0.08)", border: "1px solid rgba(124,77,255,0.3)", borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CircularProgress size={20} sx={{ color: "#7c4dff" }} />
                  <Typography color="white">Running StratifiedKFold CV on {algos.length} algorithm(s)...</Typography>
                </Box>
                <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: "#7c4dff" } }} />
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="white" mb={2}>Training Results</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Algorithm", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC", "Best"].map((h) => (
                        <TableCell key={h} sx={headSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((m) => (
                      <TableRow key={m.id}
                        sx={{ bgcolor: m.is_best ? "rgba(0,188,212,0.05)" : "transparent" }}>
                        <TableCell sx={cellSx}>
                          <Typography variant="body2" color="white" fontWeight={m.is_best ? 700 : 400}>
                            {m.algorithm?.replace(/_/g, " ")}
                          </Typography>
                        </TableCell>
                        <TableCell sx={cellSx}>{pct(m.accuracy)}</TableCell>
                        <TableCell sx={cellSx}>{pct(m.precision)}</TableCell>
                        <TableCell sx={cellSx}>{pct(m.recall)}</TableCell>
                        <TableCell sx={{ ...cellSx, color: "#00bcd4", fontWeight: 700 }}>{pct(m.f1_score)}</TableCell>
                        <TableCell sx={cellSx}>{pct(m.roc_auc)}</TableCell>
                        <TableCell sx={cellSx}>
                          {m.is_best ? <EmojiEvents sx={{ color: "#ffd600", fontSize: 20 }} /> :
                            m.status === "error" ? <ErrIcon sx={{ color: "#ef5350", fontSize: 18 }} /> : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {results.find((m) => m.is_best)?.cross_val_scores?.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                      Best model CV F1 scores: {results.find((m) => m.is_best).cross_val_scores.map((s) => `${(s * 100).toFixed(1)}%`).join(" · ")}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
