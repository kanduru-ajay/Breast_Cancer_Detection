from rest_framework import serializers
from .models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source="model.name", read_only=True)
    algorithm = serializers.CharField(source="model.algorithm", read_only=True)

    class Meta:
        model = Prediction
        fields = "__all__"
        read_only_fields = ["id", "user", "result", "confidence", "malignant_prob",
                            "benign_prob", "shap_values", "top_features", "created_at"]


class PredictRequestSerializer(serializers.Serializer):
    model_id = serializers.IntegerField()
    patient_id = serializers.CharField(required=False, allow_blank=True)
    features = serializers.DictField(child=serializers.FloatField())
