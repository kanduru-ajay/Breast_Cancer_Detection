from rest_framework import serializers
from .models import TrainedModel


class TrainedModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainedModel
        fields = "__all__"
        read_only_fields = ["id", "user", "status", "model_path", "scaler_path",
                            "accuracy", "precision", "recall", "f1_score", "roc_auc",
                            "specificity", "confusion_matrix", "roc_curve_data",
                            "feature_importance", "is_best", "training_log",
                            "cross_val_scores", "created_at"]


class TrainRequestSerializer(serializers.Serializer):
    dataset_id = serializers.IntegerField()
    algorithms = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            "logistic_regression", "svm", "random_forest", "xgboost"
        ]),
        default=["logistic_regression", "random_forest", "xgboost"]
    )
    target_column = serializers.CharField(default="diagnosis")
    feature_selection = serializers.BooleanField(default=True)
    n_features = serializers.IntegerField(default=20, min_value=5, max_value=100)
    handle_imbalance = serializers.BooleanField(default=True)
    hyperparameters = serializers.DictField(required=False, default=dict)
