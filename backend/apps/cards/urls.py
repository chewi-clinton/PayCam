from django.urls import path
from .views import CardInitiateView

urlpatterns = [
    path("initiate/", CardInitiateView.as_view(), name="card-initiate"),
]
