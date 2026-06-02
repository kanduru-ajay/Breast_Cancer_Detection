from rest_framework import serializers
from .models import Dataset


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = "__all__"
        read_only_fields = ["id", "user", "status", "row_count", "feature_count",
                            "columns", "preprocessing_log", "feature_stats",
                            "positive_count", "negative_count", "class_balance",
                            "created_at", "updated_at"]


class DatasetUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    target_column = serializers.CharField(default="diagnosis")
