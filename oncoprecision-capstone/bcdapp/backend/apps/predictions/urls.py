from django.urls import path
from . import views

urlpatterns = [
    path("", views.PredictionListView.as_view()),
    path("predict/", views.PredictView.as_view()),
    path("<int:pk>/", views.PredictionDetailView.as_view()),
]
