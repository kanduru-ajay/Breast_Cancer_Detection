-- ================================================================
--  OncoPrecision – Breast Cancer Detection System
--  PostgreSQL Schema
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(150) UNIQUE NOT NULL,
    email         VARCHAR(254) UNIQUE NOT NULL,
    password      VARCHAR(128) NOT NULL,
    role          VARCHAR(15) NOT NULL DEFAULT 'clinician'
                  CHECK (role IN ('admin','clinician','researcher')),
    institution   VARCHAR(255) DEFAULT '',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role);

-- ── Datasets ─────────────────────────────────────────────────
CREATE TABLE datasets (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT DEFAULT '',
    file_path           VARCHAR(500) NOT NULL,
    original_filename   VARCHAR(255) NOT NULL,
    row_count           INT,
    feature_count       INT,
    positive_count      INT,    -- malignant samples
    negative_count      INT,    -- benign samples
    class_balance       DOUBLE PRECISION,  -- malignant ratio
    columns             JSONB DEFAULT '[]',
    status              VARCHAR(20) NOT NULL DEFAULT 'uploaded'
                        CHECK (status IN ('uploaded','processing','ready','error')),
    preprocessing_log   JSONB DEFAULT '[]',
    feature_stats       JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_datasets_user   ON datasets(user_id);
CREATE INDEX idx_datasets_status ON datasets(status);

-- ── Trained Models ───────────────────────────────────────────
CREATE TABLE trained_models (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dataset_id          BIGINT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    algorithm           VARCHAR(30) NOT NULL
                        CHECK (algorithm IN ('logistic_regression','svm','random_forest','xgboost','cnn')),
    status              VARCHAR(20) NOT NULL DEFAULT 'training'
                        CHECK (status IN ('training','ready','error')),
    hyperparameters     JSONB DEFAULT '{}',
    feature_columns     JSONB DEFAULT '[]',
    target_column       VARCHAR(100) NOT NULL DEFAULT 'diagnosis',
    model_path          VARCHAR(500),
    scaler_path         VARCHAR(500),
    selected_features   JSONB DEFAULT '[]',
    -- Classification metrics (StratifiedKFold CV averages)
    accuracy            DOUBLE PRECISION,
    precision           DOUBLE PRECISION,
    recall              DOUBLE PRECISION,      -- sensitivity
    f1_score            DOUBLE PRECISION,      -- primary selection metric
    roc_auc             DOUBLE PRECISION,
    specificity         DOUBLE PRECISION,
    -- Extended results
    confusion_matrix    JSONB DEFAULT '{}',    -- [[TN,FP],[FN,TP]]
    roc_curve_data      JSONB DEFAULT '{}',    -- {fpr:[], tpr:[]}
    feature_importance  JSONB DEFAULT '{}',    -- {feature: importance}
    cross_val_scores    JSONB DEFAULT '[]',    -- per-fold F1 scores
    is_best             BOOLEAN NOT NULL DEFAULT FALSE,
    training_log        JSONB DEFAULT '[]',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_models_dataset ON trained_models(dataset_id);
CREATE INDEX idx_models_is_best ON trained_models(is_best);
CREATE INDEX idx_models_algo    ON trained_models(algorithm);
CREATE INDEX idx_models_f1      ON trained_models(f1_score DESC NULLS LAST);

-- ── Predictions ──────────────────────────────────────────────
CREATE TABLE predictions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id        BIGINT NOT NULL REFERENCES trained_models(id) ON DELETE CASCADE,
    patient_id      VARCHAR(100) DEFAULT '',
    input_features  JSONB NOT NULL DEFAULT '{}',
    result          VARCHAR(15) NOT NULL CHECK (result IN ('benign','malignant')),
    confidence      DOUBLE PRECISION NOT NULL,
    malignant_prob  DOUBLE PRECISION NOT NULL,
    benign_prob     DOUBLE PRECISION NOT NULL,
    shap_values     JSONB DEFAULT '{}',
    top_features    JSONB DEFAULT '[]',  -- [{feature, value, importance, direction}]
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_predictions_model  ON predictions(model_id);
CREATE INDEX idx_predictions_user   ON predictions(user_id);
CREATE INDEX idx_predictions_result ON predictions(result);
CREATE INDEX idx_predictions_date   ON predictions(created_at DESC);

-- ── Trigger: auto updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_datasets_upd BEFORE UPDATE ON datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
