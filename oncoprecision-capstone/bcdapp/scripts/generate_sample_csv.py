#!/usr/bin/env python
"""
Generate a synthetic WDBC-like CSV for testing.
Based on real WDBC feature distributions.
"""
import pandas as pd
import numpy as np

np.random.seed(42)
N = 569  # same size as real WDBC

def sample_features(malignant):
    m = 1 if malignant else 0
    # Higher values generally indicate malignancy
    scale = 1.5 if malignant else 1.0
    return {
        "radius_mean":       np.random.normal(17.5 if malignant else 12.1, 2.0),
        "texture_mean":      np.random.normal(21.6 if malignant else 17.9, 3.0),
        "perimeter_mean":    np.random.normal(115.4 if malignant else 78.1, 15.0),
        "area_mean":         np.random.normal(978.4 if malignant else 462.8, 200.0),
        "smoothness_mean":   np.random.normal(0.103 if malignant else 0.093, 0.013),
        "compactness_mean":  np.random.normal(0.145 if malignant else 0.081, 0.05),
        "concavity_mean":    np.random.normal(0.161 if malignant else 0.047, 0.07),
        "concave_points_mean": np.random.normal(0.088 if malignant else 0.026, 0.03),
        "symmetry_mean":     np.random.normal(0.193 if malignant else 0.182, 0.025),
        "fractal_dimension_mean": np.random.normal(0.062 if malignant else 0.062, 0.007),
        "radius_se":         np.random.normal(0.609 if malignant else 0.284, 0.3),
        "texture_se":        np.random.normal(1.21 if malignant else 1.22, 0.5),
        "perimeter_se":      np.random.normal(4.32 if malignant else 2.0, 1.5),
        "area_se":           np.random.normal(72.7 if malignant else 21.1, 40.0),
        "radius_worst":      np.random.normal(21.1 if malignant else 14.1, 3.0),
        "texture_worst":     np.random.normal(29.3 if malignant else 23.5, 5.0),
        "perimeter_worst":   np.random.normal(141.4 if malignant else 91.9, 20.0),
        "area_worst":        np.random.normal(1422 if malignant else 625, 350),
        "concavity_worst":   np.random.normal(0.45 if malignant else 0.14, 0.15),
        "concave_points_worst": np.random.normal(0.182 if malignant else 0.074, 0.06),
        "diagnosis": "M" if malignant else "B",
    }

n_malignant = 212
n_benign = 357
rows = [sample_features(True) for _ in range(n_malignant)] + \
       [sample_features(False) for _ in range(n_benign)]
df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
df.insert(0, "id", range(842001, 842001 + len(df)))
# Clip negatives
num_cols = df.select_dtypes(include=[float]).columns
df[num_cols] = df[num_cols].clip(lower=0)

df.to_csv("wdbc_sample.csv", index=False)
print(f"Generated wdbc_sample.csv — {len(df)} rows ({n_malignant} M, {n_benign} B)")
