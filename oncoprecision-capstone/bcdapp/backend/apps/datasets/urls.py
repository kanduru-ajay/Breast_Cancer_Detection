from django.urls import path
from . import views

urlpatterns = [
    path("", views.DatasetListView.as_view()),
    path("upload/", views.DatasetUploadView.as_view()),
    path("<int:pk>/", views.DatasetDetailView.as_view()),
]
