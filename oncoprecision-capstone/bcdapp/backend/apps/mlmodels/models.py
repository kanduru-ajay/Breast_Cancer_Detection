from django.db import models
from apps.users.models import User
from apps.datasets.models import Dataset


class TrainedModel(models.Model):
    ALGORITHM_CHOICES = [
        ("logistic_regression", "Logistic Regression"),
        ("svm", "Support Vector Machine"),
        ("random_forest", "Random Forest"),
        ("xgboost", "XGBoost"),
        ("cnn", "CNN (Image)"),
    ]
    STATUS_CHOICES = [("training", "Training"), ("ready", "Ready"), ("error", "Error")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="models")
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="models")
    name = models.CharField(max_length=255)
    algorithm = models.CharField(max_length=30, choices=ALGORITHM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="training")
    hyperparameters = models.JSONField(default=dict)
    feature_columns = models.JSONField(default=list)
    target_column = models.CharField(max_length=100, default="diagnosis")
    model_path = models.CharField(max_length=500, null=True)
    scaler_path = models.CharField(max_length=500, null=True)
    selected_features = models.JSONField(default=list)
    # Classification metrics
    accuracy = models.FloatField(null=True)
    precision = models.FloatField(null=True)
    recall = models.FloatField(null=True)
    f1_score = models.FloatField(null=True)
    roc_auc = models.FloatField(null=True)
    specificity = models.FloatField(null=True)
    # Confusion matrix
    confusion_matrix = models.JSONField(default=dict)
    # ROC curve data
    roc_curve_data = models.JSONField(default=dict)
    # Feature importance
    feature_importance = models.JSONField(default=dict)
    is_best = models.BooleanField(default=False)
    training_log = models.JSONField(default=list)
    cross_val_scores = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trained_models"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.algorithm} | F1={self.f1_score:.4f}" if self.f1_score else self.algorithm
