from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [("admin", "Admin"), ("clinician", "Clinician"), ("researcher", "Researcher")]
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default="clinician")
    institution = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

    def is_admin(self):
        return self.role == "admin"
