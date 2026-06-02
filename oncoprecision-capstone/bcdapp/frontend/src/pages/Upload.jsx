import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  LinearProgress, Alert, Chip, Grid, Divider,
} from "@mui/material";
import { CloudUpload, CheckCircle, DatasetOutlined } from "@mui/icons-material";
import { datasetAPI } from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", target_column: "diagnosis" });
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((acc) => { if (acc[0]) { setFile(acc[0]); setError(""); } }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1 });

  const handleUpload = async () => {
    if (!file || !form.name) { setError("Provide CSV file and dataset name"); return; }
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("target_column", form.target_column);
    try {
      const r = await datasetAPI.upload(fd);
      setResult(r.data); setFile(null);
    } catch (e) { setError(e.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <Box maxWidth={750} mx="auto">
      <Typography variant="h4" fontWeight={800} color="white" mb={0.5}>Upload Dataset</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.4)" }} mb={3}>
        Upload CSV (WDBC format or custom). System auto-cleans, encodes, and analyzes class balance.
      </Typography>

      <Card sx={{ mb: 2.5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <CardContent>
          <Box {...getRootProps()} sx={{
            border: "2px dashed", borderColor: isDragActive ? "#00bcd4" : "rgba(255,255,255,0.15)",
            borderRadius: 2, p: 5, textAlign: "center", cursor: "pointer",
            bgcolor: isDragActive ? "rgba(0,188,212,0.06)" : "transparent",
            transition: "all 0.2s",
            "&:hover": { borderColor: "#00bcd4", bgcolor: "rgba(0,188,212,0.04)" },
          }}>
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: "#00bcd4", mb: 1.5, opacity: 0.8 }} />
            <Typography variant="h6" color="white">
              {file ? file.name : isDragActive ? "Release to upload" : "Drag & drop CSV file"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
              Supports WDBC, UCI, or custom CSV · Max 50MB
            </Typography>
            {file && <Chip label={`${(file.size / 1024 / 1024).toFixed(2)} MB`} size="small" sx={{ mt: 1, bgcolor: "rgba(0,188,212,0.15)", color: "#00bcd4" }} />}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2.5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} color="white" mb={2}>Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Dataset Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. WDBC Primary Cohort" sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Target Column" value={form.target_column}
                onChange={(e) => setForm({ ...form, target_column: e.target.value })}
                helperText="Column with M/B or 0/1 labels" sx={inputSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description (optional)" value={form.description} multiline rows={2}
                onChange={(e) => setForm({ ...form, description: e.target.value })} sx={inputSx} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {uploading && <LinearProgress sx={{ mb: 2, "& .MuiLinearProgress-bar": { bgcolor: "#00bcd4" } }} />}

      <Button fullWidth variant="contained" size="large" onClick={handleUpload}
        disabled={uploading || !file || !form.name} startIcon={<CloudUpload />}
        sx={{ background: "linear-gradient(90deg, #00bcd4, #0288d1)", fontWeight: 700,
          "&:hover": { background: "linear-gradient(90deg, #00acc1, #0277bd)" } }}>
        {uploading ? "Processing Dataset..." : "Upload & Preprocess"}
      </Button>

      {result && (
        <Card sx={{ mt: 3, border: "1px solid #26a69a44", background: "rgba(38,166,154,0.06)", borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <CheckCircle sx={{ color: "#26a69a" }} />
              <Typography variant="h6" color="#26a69a" fontWeight={700}>Dataset Ready</Typography>
            </Box>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
            <Grid container spacing={2}>
              {[
                ["Rows", result.row_count],
                ["Features", result.feature_count],
                ["Malignant", result.positive_count],
                ["Benign", result.negative_count],
                ["Malignant Ratio", result.class_balance ? `${(result.class_balance * 100).toFixed(1)}%` : "—"],
                ["Status", result.status],
              ].map(([k, v]) => (
                <Grid item xs={6} sm={4} key={k}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>{k}</Typography>
                  <Typography variant="body1" color="white" fontWeight={600}>{v ?? "—"}</Typography>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
              Log: {result.preprocessing_log?.join(" → ")}
            </Typography>
          </CardContent>
        </Card>
      )}
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
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#00bcd4" },
  "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.3)" },
};
