import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, CircularProgress,
  TextField, InputAdornment, Select, MenuItem, FormControl,
} from "@mui/material";
import { Search, Warning, CheckCircle } from "@mui/icons-material";
import { predictionAPI } from "../services/api";

const cellSx = { color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.06)", fontSize: 13 };
const headSx = { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.06)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 };

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  useEffect(() => {
    predictionAPI.list().then((r) => {
      setPredictions(r.data.results || r.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = predictions.filter((p) => {
    const matchRes = resultFilter === "all" || p.result === resultFilter;
    const matchSearch = !filter || p.patient_id?.toLowerCase().includes(filter.toLowerCase()) || p.algorithm?.toLowerCase().includes(filter.toLowerCase());
    return matchRes && matchSearch;
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} color="white" mb={0.5}>Prediction History</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.4)" }} mb={3}>
        All classification records · {predictions.length} total
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <TextField placeholder="Search patient ID or model…" value={filter} onChange={(e) => setFilter(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }} /></InputAdornment> }}
          sx={{ flex: 1, ...inputSx }} size="small" />
        <FormControl sx={{ minWidth: 140 }} size="small">
          <Select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}
            sx={{ color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" } }}>
            <MenuItem value="all">All Results</MenuItem>
            <MenuItem value="malignant">Malignant</MenuItem>
            <MenuItem value="benign">Benign</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={5}><CircularProgress size={36} sx={{ color: "#00bcd4" }} /></Box>
          ) : filtered.length === 0 ? (
            <Box textAlign="center" p={5}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)" }}>No predictions found.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  {["Patient ID", "Model", "Result", "Confidence", "Malignant P", "Benign P", "Date"].map((h) => (
                    <TableCell key={h} sx={headSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}>
                    <TableCell sx={cellSx}>{p.patient_id || `P-${p.id}`}</TableCell>
                    <TableCell sx={cellSx}>{p.algorithm?.replace(/_/g, " ") || p.model_name}</TableCell>
                    <TableCell sx={cellSx}>
                      <Chip
                        icon={p.result === "malignant" ? <Warning sx={{ fontSize: 14 }} /> : <CheckCircle sx={{ fontSize: 14 }} />}
                        label={p.result}
                        size="small"
                        sx={{
                          bgcolor: p.result === "malignant" ? "rgba(239,83,80,0.15)" : "rgba(38,166,154,0.15)",
                          color: p.result === "malignant" ? "#ef5350" : "#26a69a",
                          borderColor: p.result === "malignant" ? "#ef535044" : "#26a69a44",
                          border: "1px solid",
                          textTransform: "capitalize",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{(p.confidence * 100).toFixed(1)}%</TableCell>
                    <TableCell sx={{ ...cellSx, color: "#ef5350" }}>{(p.malignant_prob * 100).toFixed(1)}%</TableCell>
                    <TableCell sx={{ ...cellSx, color: "#26a69a" }}>{(p.benign_prob * 100).toFixed(1)}%</TableCell>
                    <TableCell sx={cellSx}>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(0,188,212,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "#00bcd4" },
  },
  "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.3)" },
};
