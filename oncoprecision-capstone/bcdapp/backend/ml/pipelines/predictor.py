import pickle
import numpy as np


class CancerPredictor:
    """Run inference + lightweight feature-importance explainability."""

    def __init__(self, trained_model):
        self.db_model = trained_model
        with open(trained_model.model_path, "rb") as f:
            self.clf = pickle.load(f)
        with open(trained_model.scaler_path, "rb") as f:
            payload = pickle.load(f)
        self.scaler = payload["scaler"]
        self.features = payload["features"]

    def predict(self, raw_features: dict) -> dict:
        # Build feature vector in correct order, fill missing with 0
        X = np.array([[raw_features.get(f, 0.0) for f in self.features]])
        X_scaled = self.scaler.transform(X)

        pred = int(self.clf.predict(X_scaled)[0])
        if hasattr(self.clf, "predict_proba"):
            proba = self.clf.predict_proba(X_scaled)[0]
            mal_prob = float(proba[1])
            ben_prob = float(proba[0])
        else:
            score = float(self.clf.decision_function(X_scaled)[0])
            mal_prob = float(1 / (1 + np.exp(-score)))
            ben_prob = 1 - mal_prob

        result = "malignant" if pred == 1 else "benign"
        confidence = mal_prob if pred == 1 else ben_prob

        # Lightweight local explanation: feature × |weight|
        top_features = self._explain(X_scaled[0], raw_features)

        return {
            "result": result,
            "confidence": round(confidence, 4),
            "malignant_prob": round(mal_prob, 4),
            "benign_prob": round(ben_prob, 4),
            "shap_values": {},   # extend with shap library if installed
            "top_features": top_features,
        }

    def _explain(self, x_scaled, raw_features):
        """Return top-10 features by impact on prediction."""
        fi = self.db_model.feature_importance or {}
        top = []
        for feat in self.features:
            raw_val = raw_features.get(feat, 0.0)
            importance = fi.get(feat, 0.0)
            top.append({
                "feature": feat,
                "value": round(raw_val, 4),
                "importance": round(importance, 4),
                "direction": "increases_risk" if raw_val > 0 and importance > 0 else "decreases_risk",
            })
        top.sort(key=lambda x: x["importance"], reverse=True)
        return top[:10]
