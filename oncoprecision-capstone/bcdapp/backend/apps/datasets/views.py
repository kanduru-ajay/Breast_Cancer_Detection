import os, uuid
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Dataset
from .serializers import DatasetSerializer, DatasetUploadSerializer
from ml.pipelines.preprocessor import CancerPreprocessor


class DatasetUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = DatasetUploadSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        file = ser.validated_data["file"]
        upload_dir = os.path.join(settings.MEDIA_ROOT, "datasets")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{uuid.uuid4()}_{file.name}")
        with open(file_path, "wb+") as f:
            for chunk in file.chunks():
                f.write(chunk)

        dataset = Dataset.objects.create(
            user=request.user,
            name=ser.validated_data["name"],
            description=ser.validated_data.get("description", ""),
            file_path=file_path,
            original_filename=file.name,
            status="processing",
        )
        CancerPreprocessor(dataset, target_col=ser.validated_data["target_column"]).run()
        return Response(DatasetSerializer(dataset).data, status=201)


class DatasetListView(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Dataset.objects.all()
        return Dataset.objects.filter(user=self.request.user)


class DatasetDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Dataset.objects.all()
        return Dataset.objects.filter(user=self.request.user)
