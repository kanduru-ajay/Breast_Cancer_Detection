from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.mlmodels.models import TrainedModel
from .models import Prediction
from .serializers import PredictionSerializer, PredictRequestSerializer
from ml.pipelines.predictor import CancerPredictor


class PredictView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = PredictRequestSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        data = ser.validated_data
        try:
            model = TrainedModel.objects.get(pk=data["model_id"], status="ready")
        except TrainedModel.DoesNotExist:
            return Response({"error": "Model not found"}, status=404)

        predictor = CancerPredictor(model)
        result = predictor.predict(data["features"])

        pred = Prediction.objects.create(
            user=request.user, model=model,
            patient_id=data.get("patient_id", ""),
            input_features=data["features"],
            result=result["result"],
            confidence=result["confidence"],
            malignant_prob=result["malignant_prob"],
            benign_prob=result["benign_prob"],
            shap_values=result.get("shap_values", {}),
            top_features=result.get("top_features", []),
        )
        return Response(PredictionSerializer(pred).data, status=201)


class PredictionListView(generics.ListAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Prediction.objects.all() if self.request.user.role == "admin" \
            else Prediction.objects.filter(user=self.request.user)
        if mid := self.request.query_params.get("model_id"):
            qs = qs.filter(model_id=mid)
        if res := self.request.query_params.get("result"):
            qs = qs.filter(result=res)
        return qs


class PredictionDetailView(generics.RetrieveAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Prediction.objects.all()
        return Prediction.objects.filter(user=self.request.user)
