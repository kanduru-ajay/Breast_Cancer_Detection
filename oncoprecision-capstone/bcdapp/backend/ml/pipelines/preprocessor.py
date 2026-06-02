import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder


class CancerPreprocessor:
    """
    Medical dataset preprocessing for breast cancer classification.
    Handles: cleaning, encoding, outlier removal, class distribution.
    """

    def __init__(self, dataset, target_col="diagnosis"):
        self.dataset = dataset
        self.target_col = target_col
        self.log = []

    def run(self):
        try:
            df = pd.read_csv(self.dataset.file_path)
            self.log.append(f"Loaded {len(df)} rows, {len(df.columns)} columns")

            df = self._clean(df)
            df = self._encode_target(df)
            df = self._compute_class_stats(df)

            self.dataset.row_count = len(df)
            self.dataset.feature_count = len([c for c in df.columns if c != self.target_col])
            self.dataset.columns = list(df.columns)
            self.dataset.feature_stats = self._compute_stats(df)
            self.dataset.preprocessing_log = self.log
            self.dataset.status = "ready"
        except Exception as e:
            self.dataset.status = "error"
            self.dataset.preprocessing_log = self.log + [f"ERROR: {str(e)}"]
        finally:
            self.dataset.save()

    def _clean(self, df):
        # Drop ID-like columns
        id_cols = [c for c in df.columns if c.lower() in ("id", "patient_id", "unnamed: 32")]
        if id_cols:
            df = df.drop(columns=id_cols)
            self.log.append(f"Dropped ID columns: {id_cols}")

        # Drop cols with >40% missing
        threshold = 0.4
        missing_ratio = df.isnull().mean()
        drop_cols = missing_ratio[missing_ratio > threshold].index.tolist()
        if drop_cols:
            df = df.drop(columns=drop_cols)
            self.log.append(f"Dropped high-missing cols: {drop_cols}")

        # Fill remaining numerics with median
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

        # Remove duplicates
        before = len(df)
        df = df.drop_duplicates()
        self.log.append(f"Removed {before - len(df)} duplicates → {len(df)} rows")

        # IQR outlier removal on numeric feature columns (not target)
        feature_cols = [c for c in numeric_cols if c != self.target_col]
        for col in feature_cols:
            Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
            IQR = Q3 - Q1
            df = df[(df[col] >= Q1 - 3 * IQR) & (df[col] <= Q3 + 3 * IQR)]

        self.log.append(f"After outlier removal: {len(df)} rows")
        return df

    def _encode_target(self, df):
        if self.target_col not in df.columns:
            # Try to find a column named diagnosis/label/class/target
            candidates = [c for c in df.columns if c.lower() in ("diagnosis", "label", "class", "target", "result")]
            if candidates:
                self.target_col = candidates[0]
                self.log.append(f"Auto-detected target: {self.target_col}")
            else:
                raise ValueError(f"Target column '{self.target_col}' not found")

        col = df[self.target_col]
        if col.dtype == object:
            # M=1 (malignant), B=0 (benign) — standard WDBC encoding
            mapping = {}
            unique = col.str.upper().unique()
            for val in unique:
                if val in ("M", "MALIGNANT", "1", "POSITIVE", "YES"):
                    mapping[val] = 1
                else:
                    mapping[val] = 0
            df[self.target_col] = col.str.upper().map(mapping).fillna(0).astype(int)
            self.log.append(f"Encoded target: {mapping}")
        return df

    def _compute_class_stats(self, df):
        if self.target_col in df.columns:
            counts = df[self.target_col].value_counts()
            mal = int(counts.get(1, 0))
            ben = int(counts.get(0, 0))
            self.dataset.positive_count = mal
            self.dataset.negative_count = ben
            self.dataset.class_balance = round(mal / (mal + ben), 4) if (mal + ben) > 0 else 0
            self.log.append(f"Class distribution — Malignant: {mal}, Benign: {ben}")
        return df

    def _compute_stats(self, df):
        numeric = df.select_dtypes(include=[np.number])
        stats = {}
        for col in list(numeric.columns)[:30]:
            stats[col] = {
                "mean": round(float(numeric[col].mean()), 4),
                "std": round(float(numeric[col].std()), 4),
                "min": round(float(numeric[col].min()), 4),
                "max": round(float(numeric[col].max()), 4),
                "missing": int(df[col].isna().sum()),
            }
        return stats
