# OncoPrecision – Breast Cancer Detection System

Production-grade ML web application for binary cancer classification (Benign vs Malignant).
Built with React, Django, PostgreSQL, and scikit-learn/XGBoost.

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + MUI v5 + Recharts + Zustand |
| Backend | Django 4.2 + DRF + SimpleJWT |
| Database | PostgreSQL 15 |
| ML | Pandas · Scikit-learn · XGBoost · SMOTE (imbalanced-learn) |
| Optional | TensorFlow (CNN) · SHAP (explainability) |
| Infra | Docker Compose + Nginx + Gunicorn |

---

## Quick Start

### Docker (recommended)
```bash
git clone <repo> oncoprecision && cd oncoprecision
cd docker && docker compose up --build -d
# Backend: http://localhost:8000
# Frontend: http://localhost:80
```

### Manual

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

export DB_NAME=bcd_db DB_USER=postgres DB_PASSWORD=postgres

python manage.py migrate
python ../scripts/seed.py        # creates demo users

gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

**Frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
# → http://localhost:5173
```

---

## Sample Workflow

```
1. Login     →  dr_radha / Doctor@1234

2. Upload    →  /upload
   python scripts/generate_sample_csv.py
   Upload wdbc_sample.csv
   Target column: diagnosis
   System auto-cleans, encodes M/B → 1/0, reports class balance

3. Train     →  /train
   Select dataset, all 4 algorithms
   Enable SMOTE + Feature Selection
   Click "Train All Models"
   Best model auto-selected by F1

4. Predict   →  /predict
   Click "Load Malignant Sample" for demo data
   Select best model ⭐
   Click "Run Classification"
   View: result, confidence bars, top contributing features

5. History   →  /history
   All predictions filterable by result / patient ID

6. Dashboard →  /
   Radar chart · Model comparison bars · Pie of predictions
```

---

## Credentials
| Username    | Password      | Role       |
|-------------|---------------|------------|
| admin       | Admin@1234    | admin      |
| dr_radha    | Doctor@1234   | clinician  |
| researcher1 | Research@1234 | researcher |

---

## Folder Structure
```
oncoprecision/
├── backend/
│   ├── apps/
│   │   ├── users/         # JWT auth, role management
│   │   ├── datasets/      # CSV upload + preprocessing
│   │   ├── mlmodels/      # Training, evaluation, model storage
│   │   └── predictions/   # Inference + explainability
│   ├── core/              # Settings, URLs
│   ├── ml/
│   │   ├── pipelines/     # preprocessor.py, trainer.py, predictor.py
│   │   └── explainability/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/         # Dashboard, Upload, Train, Predict, History, Login
│       ├── services/      # api.js (axios + auto-refresh)
│       └── store/         # authStore.js (zustand)
├── docs/
│   ├── DB_SCHEMA.sql
│   ├── API_DOCS.md
│   └── ML_PIPELINE.md
├── scripts/
│   ├── seed.py
│   └── generate_sample_csv.py
└── docker/
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx.conf
```

---

## Key ML Design Decisions

| Decision | Rationale |
|----------|-----------|
| StratifiedKFold | Preserves class ratio across folds |
| SMOTE on train only | No leakage from synthetic samples into validation |
| F1 as primary metric | Balances precision and recall for medical context |
| Recall over Precision | Missing a malignant case is worse than a false alarm |
| Feature selection | Removes correlated/noise features; improves generalization |
| StandardScaler | Required for LR and SVM; applied correctly per fold |

---

## Enabling Optional Features

**SHAP Explainability**
```bash
pip install shap
# Uncomment SHAP block in ml/pipelines/predictor.py
```

**CNN (Conv1D)**
```bash
pip install tensorflow
# Add "cnn" to algorithm list in train request
```
