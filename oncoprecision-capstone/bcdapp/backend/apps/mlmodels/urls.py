from django.urls import path
from . import views

urlpatterns = [
    path("", views.ModelListView.as_view()),
    path("train/", views.TrainModelsView.as_view()),
    path("<int:pk>/", views.ModelDetailView.as_view()),
    path("best/<int:dataset_id>/", views.BestModelView.as_view()),
]
