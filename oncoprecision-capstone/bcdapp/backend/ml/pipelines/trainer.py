import os, pickle, uuid
import numpy as np
import pandas as pd
from django.conf import settings
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, roc_auc_score, confusion_matrix, roc_curve)
try:
    import xgboost as xgb
    XGB_OK = True
except ImportError:
    XGB_OK = False

try:
    from imblearn.over_sampling import SMOTE
    SMOTE_OK = True
except ImportError:
    SMOTE_OK = False


class CancerModelTrainer:
    def __init__(self, dataset, user, algorithms, target_column="diagnosis",
                 feature_selection=True, n_features=20, handle_imbalance=True,
                 hyperparameters=None):
        self.dataset = dataset
        self.user = user
        self.algorithms = algorithms
        self.target_column = target_column
        self.feature_selection = feature_selection
        self.n_features = n_features
        self.handle_imbalance = handle_imbalance
        self.hyperparameters = hyperparameters or {}
        self.model_dir = os.path.join(settings.MEDIA_ROOT, "models")
        os.makedirs(self.model_dir, exist_ok=True)

    def load_data(self):
        df = pd.read_csv(self.dataset.file_path)
        # Drop non-numeric & ID-like
        df = df.select_dtypes(include=[np.number])
        if self.target_column not in df.columns:
            raise ValueError(f"Target '{self.target_column}' not found")
        X = df.drop(columns=[self.target_column]).fillna(0)
        y = df[self.target_column].fillna(0).astype(int)
        return X, y

    def select_features(self, X, y):
        k = min(self.n_features, X.shape[1])
        selector = SelectKBest(f_classif, k=k)
        selector.fit(X, y)
        mask = selector.get_support()
        selected = X.columns[mask].tolist()
        return X[selected], selected

    def compute_metrics(self, y_true, y_pred, y_prob):
        cm = confusion_matrix(y_true, y_pred).tolist()
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_true, y_prob)),
            "specificity": specificity,
            "confusion_matrix": cm,
            "roc_curve": {"fpr": fpr.tolist()[:50], "tpr": tpr.tolist()[:50]},
        }

    def train_model(self, algo_name, model_cls, params, X, y, feature_cols):
        from apps.mlmodels.models import TrainedModel
        scaler = StandardScaler()
        X_arr = X.values
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = []

        # Handle class imbalance
        if self.handle_imbalance and SMOTE_OK:
            smote = SMOTE(random_state=42)
            X_res, y_res = smote.fit_resample(X_arr, y)
        else:
            X_res, y_res = X_arr, y.values

        X_scaled = scaler.fit_transform(X_res)

        # CV evaluation
        clf = model_cls(**params)
        cv_f1 = cross_val_score(clf, X_scaled, y_res, cv=skf, scoring="f1", n_jobs=-1)
        cv_scores = cv_f1.tolist()

        # Final fit
        clf.fit(X_scaled, y_res)

        # Evaluate on original (unaugmented) data for honest metrics
        X_eval = scaler.transform(X_arr)
        y_pred = clf.predict(X_eval)
        if hasattr(clf, "predict_proba"):
            y_prob = clf.predict_proba(X_eval)[:, 1]
        else:
            y_prob = clf.decision_function(X_eval)
            y_prob = (y_prob - y_prob.min()) / (y_prob.max() - y_prob.min() + 1e-8)

        metrics = self.compute_metrics(y.values, y_pred, y_prob)

        # Feature importance
        fi = {}
        if hasattr(clf, "feature_importances_"):
            fi = dict(zip(feature_cols, clf.feature_importances_.tolist()))
        elif hasattr(clf, "coef_"):
            coef = clf.coef_[0] if clf.coef_.ndim > 1 else clf.coef_
            fi = dict(zip(feature_cols, np.abs(coef).tolist()))

        # Persist
        model_path = os.path.join(self.model_dir, f"{uuid.uuid4()}.pkl")
        scaler_path = os.path.join(self.model_dir, f"{uuid.uuid4()}_scaler.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(clf, f)
        with open(scaler_path, "wb") as f:
            pickle.dump({"scaler": scaler, "features": feature_cols}, f)

        db_model = TrainedModel.objects.create(
            user=self.user, dataset=self.dataset,
            name=f"{algo_name.replace('_', ' ').title()} — {self.dataset.name}",
            algorithm=algo_name, status="ready",
            hyperparameters=params, feature_columns=feature_cols,
            target_column=self.target_column,
            model_path=model_path, scaler_path=scaler_path,
            selected_features=feature_cols,
            accuracy=metrics["accuracy"], precision=metrics["precision"],
            recall=metrics["recall"], f1_score=metrics["f1"],
            roc_auc=metrics["roc_auc"], specificity=metrics["specificity"],
            confusion_matrix=metrics["confusion_matrix"],
            roc_curve_data=metrics["roc_curve"],
            feature_importance=fi,
            cross_val_scores=cv_scores,
            training_log=[f"CV F1 fold {i+1}: {s:.4f}" for i, s in enumerate(cv_scores)],
        )
        return db_model

    def train_all(self):
        X, y = self.load_data()
        if self.feature_selection:
            X, feature_cols = self.select_features(X, y)
        else:
            feature_cols = X.columns.tolist()

        configs = {
            "logistic_regression": (LogisticRegression, {
                "C": 1.0, "max_iter": 1000, "random_state": 42, "class_weight": "balanced"
            }),
            "svm": (SVC, {
                "C": 1.0, "kernel": "rbf", "probability": True,
                "random_state": 42, "class_weight": "balanced"
            }),
            "random_forest": (RandomForestClassifier, {
                "n_estimators": 200, "max_depth": 10,
                "random_state": 42, "class_weight": "balanced", "n_jobs": -1
            }),
        }

        trained = []
        for algo in self.algorithms:
            hp = self.hyperparameters.get(algo, {})
            try:
                if algo == "xgboost":
                    if not XGB_OK:
                        continue
                    defaults = {"n_estimators": 200, "max_depth": 6, "learning_rate": 0.05,
                                "subsample": 0.8, "scale_pos_weight": 1, "random_state": 42,
                                "eval_metric": "logloss", "use_label_encoder": False}
                    defaults.update(hp)
                    m = self.train_model("xgboost", xgb.XGBClassifier, defaults, X, y, feature_cols)
                elif algo in configs:
                    cls, defaults = configs[algo]
                    defaults.update(hp)
                    m = self.train_model(algo, cls, defaults, X, y, feature_cols)
                else:
                    continue
                trained.append(m)
            except Exception as e:
                print(f"Training {algo} failed: {e}")

        # Best = highest F1
        if trained:
            best = max(trained, key=lambda m: m.f1_score or 0)
            best.is_best = True
            best.save()

        return trained
