from django.db import models
from apps.users.models import User
from apps.mlmodels.models import TrainedModel


class Prediction(models.Model):
    RESULT_CHOICES = [("benign", "Benign"), ("malignant", "Malignant")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE, related_name="predictions")
    patient_id = models.CharField(max_length=100, blank=True)
    input_features = models.JSONField(default=dict)
    result = models.CharField(max_length=15, choices=RESULT_CHOICES)
    confidence = models.FloatField()           # probability of predicted class
    malignant_prob = models.FloatField()       # P(malignant)
    benign_prob = models.FloatField()          # P(benign)
    # Explainability
    shap_values = models.JSONField(default=dict)
    top_features = models.JSONField(default=list)  # [{feature, value, impact, direction}]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predictions"
        ordering = ["-created_at"]
