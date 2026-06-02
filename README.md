# 🩺 OncoPrecision – Breast Cancer Detection System

## 📌 Project Overview

OncoPrecision is an AI-powered web application that helps classify breast tumors as **Benign** (non-cancerous) or **Malignant** (cancerous).

The system allows users to:

✅ Upload medical datasets
✅ Train Machine Learning models
✅ Compare model performance
✅ Predict cancer risk
✅ View analytics dashboards
✅ Track prediction history

---

# 🎯 Problem Statement

Early detection of breast cancer significantly improves treatment success rates.

This project uses Machine Learning algorithms to analyze patient diagnostic data and predict whether a tumor is:

* **Benign (Safe)**
* **Malignant (Cancerous)**

The goal is to assist healthcare professionals with faster and more informed decision-making.

---

# 🏗️ System Architecture

```text id="v87rwg"
                     ┌─────────────────┐
                     │     User        │
                     │ (Doctor/Admin)  │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ React Frontend  │
                     │     (UI)        │
                     └────────┬────────┘
                              │ API Calls
                              ▼
                     ┌─────────────────┐
                     │ Django REST API │
                     │    Backend      │
                     └────────┬────────┘
                              │
            ┌─────────────────┼──────────────────┐
            │                 │                  │
            ▼                 ▼                  ▼

 ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
 │ Authentication │  │ ML Pipeline    │  │ PostgreSQL DB  │
 │ JWT Security   │  │ Train/Predict  │  │ Data Storage   │
 └────────────────┘  └────────────────┘  └────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Prediction Result │
                    └──────────────────┘
```

---

# 🔄 Complete Workflow

```text id="l6o4o8"
        Dataset Upload
                │
                ▼
      Data Preprocessing
                │
                ▼
        Feature Selection
                │
                ▼
      Handle Imbalance (SMOTE)
                │
                ▼
         Train ML Models
                │
                ▼
       Evaluate Performance
                │
                ▼
      Select Best ML Model
                │
                ▼
       Make Predictions
                │
                ▼
       Visualize Results
```

---

# 🧠 Machine Learning Pipeline

```text id="mw7tkz"
CSV Dataset
     │
     ▼
Cleaning Missing Values
     │
     ▼
Encoding Labels
(M → 1, B → 0)
     │
     ▼
Train/Test Split
     │
     ▼
Feature Scaling
     │
     ▼
SMOTE Balancing
(Optional)
     │
     ▼
Model Training
     │
     ▼
Performance Evaluation
     │
     ▼
Best Model Selection
```

---

# 🛠️ Technology Stack

| Layer            | Technology      |
| ---------------- | --------------- |
| Frontend         | React 18 + Vite |
| UI Components    | Material UI     |
| State Management | Zustand         |
| Charts           | Recharts        |
| Backend          | Django + DRF    |
| Authentication   | JWT             |
| Database         | PostgreSQL      |
| Machine Learning | Scikit-learn    |
| Advanced Model   | XGBoost         |
| Deployment       | Docker + Nginx  |

---

# 📂 Project Structure

```text id="5xq4e6"
oncoprecision/
│
├── frontend/                     # React Application
│   └── src/
│       ├── pages/
│       │   ├── Dashboard
│       │   ├── Upload
│       │   ├── Train
│       │   ├── Predict
│       │   ├── History
│       │   └── Login
│       │
│       ├── services/
│       │   └── API Communication
│       │
│       └── store/
│           └── Authentication State
│
├── backend/
│   ├── apps/
│   │   ├── users/
│   │   ├── datasets/
│   │   ├── mlmodels/
│   │   └── predictions/
│   │
│   ├── core/
│   ├── ml/
│   └── requirements.txt
│
├── scripts/
├── docs/
└── docker/
```

---

# 🚀 Features

## 🔐 Authentication

* JWT Login
* Role-Based Access
* Secure APIs

### Supported Roles

| Role       | Access                    |
| ---------- | ------------------------- |
| Admin      | Full Control              |
| Clinician  | Prediction & Monitoring   |
| Researcher | Model Training & Analysis |

---

## 📤 Dataset Upload

Users can upload CSV datasets.

System automatically:

* Detects missing values
* Cleans data
* Encodes labels
* Generates dataset statistics

---

## 🤖 Model Training

Supported algorithms:

* Logistic Regression
* Random Forest
* Support Vector Machine (SVM)
* XGBoost

Optional:

* Feature Selection
* SMOTE Balancing

---

## 📊 Model Evaluation

Metrics displayed:

* Accuracy
* Precision
* Recall
* F1 Score
* ROC-AUC

The system automatically selects the best model based on F1 Score.

---

## 🔮 Prediction Module

Users can:

* Select trained model
* Enter patient features
* Run classification

Output includes:

* Benign/Malignant Result
* Confidence Score
* Feature Importance

---

## 📈 Dashboard Analytics

Interactive charts:

* Model Comparison
* Prediction Distribution
* Performance Metrics
* Historical Trends

---

# 👨‍⚕️ Example User Journey

```text id="p9v19v"
Login
  │
  ▼
Upload Dataset
  │
  ▼
Train Models
  │
  ▼
Compare Results
  │
  ▼
Select Best Model
  │
  ▼
Predict Cancer Type
  │
  ▼
View Dashboard Analytics
```

---

# 🔑 Demo Credentials

| Username    | Password      |
| ----------- | ------------- |
| admin       | Admin@1234    |
| dr_radha    | Doctor@1234   |
| researcher1 | Research@1234 |

---

# ⚡ Quick Start

## Backend

```bash id="40b6iu"
cd backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

Backend:

```text id="2e8a6t"
http://localhost:8000
```

---

## Frontend

```bash id="1pnm86"
cd frontend

npm install

npm run dev
```

Frontend:

```text id="sl6p0x"
http://localhost:5173
```

---

# 📚 Why This Project Matters

This project demonstrates:

* Full-Stack Development
* Machine Learning Engineering
* REST API Development
* Data Preprocessing
* Model Evaluation
* Healthcare AI Applications
* Docker Deployment

It is suitable for:

* Final Year Projects
* AI/ML Portfolios
* Full-Stack Portfolio Projects
* Healthcare Analytics Research

---


