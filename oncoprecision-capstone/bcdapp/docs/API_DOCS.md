# OncoPrecision – REST API Reference

Base URL: `http://localhost:8000/api`  
Auth: `Authorization: Bearer <access_token>` (all endpoints except register & login)

---

## Authentication

### POST /auth/register/
```json
{ "username": "dr_smith", "email": "smith@hospital.org", "password": "Secure@1234", "role": "clinician", "institution": "Chennai Cancer Centre" }
```
Response `201`: User object

### POST /auth/login/
```json
{ "username": "dr_smith", "password": "Secure@1234" }
```
Response `200`: `{ access, refresh }` — JWT payload includes `role`, `username`, `institution`

### POST /auth/token/refresh/
```json
{ "refresh": "<refresh_token>" }
```

---

## Datasets

### POST /datasets/upload/
`Content-Type: multipart/form-data`
| Field         | Type   | Required | Default     |
|---------------|--------|----------|-------------|
| file          | File   | ✓        |             |
| name          | String | ✓        |             |
| description   | String |          |             |
| target_column | String |          | "diagnosis" |

Response `201`:
```json
{
  "id": 1, "name": "WDBC Primary", "status": "ready",
  "row_count": 569, "feature_count": 30,
  "positive_count": 212, "negative_count": 357,
  "class_balance": 0.373,
  "preprocessing_log": ["Loaded 569 rows", "Dropped ID columns", "..."]
}
```

### GET /datasets/
List datasets (own for clinician, all for admin).

### GET /datasets/{id}/
### DELETE /datasets/{id}/

---

## Models

### POST /models/train/
```json
{
  "dataset_id": 1,
  "algorithms": ["logistic_regression", "svm", "random_forest", "xgboost"],
  "target_column": "diagnosis",
  "feature_selection": true,
  "n_features": 20,
  "handle_imbalance": true,
  "hyperparameters": {
    "random_forest": { "n_estimators": 300 }
  }
}
```
Response `201`: Array of TrainedModel. Best model flagged `is_best: true` (highest F1).

### GET /models/?dataset_id={id}
List trained models.

### GET /models/{id}/
Full detail including `confusion_matrix`, `roc_curve_data`, `feature_importance`, `cross_val_scores`.

### GET /models/best/{dataset_id}/
Returns best model for dataset.

---

## Predictions

### POST /predictions/predict/
```json
{
  "model_id": 3,
  "patient_id": "PT-20240115-001",
  "features": {
    "radius_mean": 17.99,
    "texture_mean": 10.38,
    "perimeter_mean": 122.8,
    "area_mean": 1001.0,
    "smoothness_mean": 0.1184
  }
}
```
Response `201`:
```json
{
  "id": 12,
  "result": "malignant",
  "confidence": 0.9832,
  "malignant_prob": 0.9832,
  "benign_prob": 0.0168,
  "top_features": [
    { "feature": "area_worst", "value": 2019.0, "importance": 0.142, "direction": "increases_risk" },
    { "feature": "radius_worst", "value": 25.38, "importance": 0.118, "direction": "increases_risk" }
  ]
}
```

### GET /predictions/?result=malignant&model_id=3
### GET /predictions/{id}/

---

## Metrics Summary

| Metric      | Description | Clinical Relevance |
|-------------|-------------|-------------------|
| Accuracy    | Overall correct classifications | General performance |
| Precision   | TP / (TP + FP) | Low false positives |
| Recall      | TP / (TP + FN) | Low false negatives (critical) |
| F1 Score    | Harmonic mean P+R | **Primary selection metric** |
| ROC-AUC     | Area under ROC curve | Discrimination ability |
| Specificity | TN / (TN + FP) | Correctly identifies benign |

**Note**: In cancer detection, Recall (sensitivity) is critical — false negatives mean missed malignancies.

## Error Codes
| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Invalid/expired JWT |
| 403 | Insufficient role |
| 404 | Resource not found |
| 429 | Rate limited (500 req/hour) |
