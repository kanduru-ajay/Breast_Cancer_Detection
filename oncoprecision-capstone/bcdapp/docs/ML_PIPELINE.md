# ML Pipeline Design

## Flow
```
CSV Upload → Preprocessing → Feature Selection → Training (CV) → Evaluation → Prediction → Explainability
```

## Stage 1 – Preprocessing (CancerPreprocessor)
- Drop ID/unnamed columns
- Drop columns with >40% missing values
- Fill remaining NaN with column median
- Remove duplicate rows
- IQR outlier removal (3×IQR) on feature columns
- Encode target: M→1 (malignant), B→0 (benign) — auto-detects WDBC format
- Compute class distribution stats

## Stage 2 – Feature Selection (SelectKBest)
- ANOVA F-test (`f_classif`) between each feature and target
- Selects top-K features (configurable, default 20)
- Reduces dimensionality, removes noise, improves generalization

## Stage 3 – Class Imbalance Handling
- SMOTE (Synthetic Minority Over-sampling Technique) via `imbalanced-learn`
- Applied on training folds only — prevents leakage
- Configurable: `handle_imbalance=True/False`

## Stage 4 – Training & Cross-Validation (CancerModelTrainer)
| Setting | Value |
|---------|-------|
| CV Strategy | StratifiedKFold (5 folds) |
| Scaling | StandardScaler (fit on train, transform on val) |
| Scoring | F1 (primary), Accuracy, ROC-AUC |
| Imbalance | SMOTE on training data only |
| Parallelism | n_jobs=-1 where supported |

### Algorithms
| Algorithm | Key Hyperparameters | Notes |
|-----------|---------------------|-------|
| Logistic Regression | C=1.0, class_weight=balanced | L2 regularization |
| SVM | C=1.0, kernel=rbf, probability=True | RBF kernel for non-linear boundaries |
| Random Forest | n_estimators=200, max_depth=10 | Feature importances via Gini |
| XGBoost | n_estimators=200, lr=0.05, max_depth=6 | scale_pos_weight for imbalance |
| CNN (optional) | Conv1D → Pool → Dense | Requires TensorFlow |

## Stage 5 – Evaluation
- Metrics computed on original (un-SMOTE'd) held-out data for honest reporting
- Confusion matrix → TP, TN, FP, FN
- ROC curve → FPR/TPR at 50 threshold points
- Feature importance stored per model

## Stage 6 – Auto-Selection
Best model = highest F1 score → `is_best = True`
F1 chosen because it balances precision (avoid unnecessary biopsies) and recall (avoid missed cancers).

## Stage 7 – Prediction & Explainability (CancerPredictor)
1. Load pickled classifier + scaler from disk
2. Align input features to training feature order
3. Scale with saved StandardScaler
4. `predict()` → binary class, `predict_proba()` → probabilities
5. Local explanation: rank features by `|feature_importance × scaled_value|`
6. Return top-10 contributing features with direction (increases/decreases risk)

## Optional LSTM/CNN Extension
```python
# Conv1D approach for tabular features
model = Sequential([
    Reshape((n_features, 1)),
    Conv1D(64, 3, activation='relu', padding='same'),
    MaxPooling1D(2),
    Conv1D(128, 3, activation='relu'),
    GlobalAveragePooling1D(),
    Dense(64, activation='relu'),
    Dropout(0.3),
    Dense(1, activation='sigmoid')
])
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy', AUC()])
```
Enable: install tensorflow, add "cnn" to algorithm list.

## SHAP Integration (Optional)
```python
import shap
explainer = shap.TreeExplainer(clf)  # for RF/XGBoost
shap_values = explainer.shap_values(X_scaled)
# Store per-prediction SHAP values in predictions.shap_values JSONB
```
Enable: `pip install shap` and extend CancerPredictor._explain()
