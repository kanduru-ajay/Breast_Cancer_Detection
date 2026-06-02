#!/usr/bin/env python
"""Seed demo users."""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.users.models import User

users = [
    {"username": "admin", "email": "admin@onco.io", "password": "Admin@1234", "role": "admin", "is_staff": True, "is_superuser": True, "institution": "OncoPrecision HQ"},
    {"username": "dr_radha", "email": "radha@hospital.in", "password": "Doctor@1234", "role": "clinician", "institution": "Chennai Cancer Centre"},
    {"username": "researcher1", "email": "research@lab.in", "password": "Research@1234", "role": "researcher", "institution": "IIT Madras"},
]
for u in users:
    if not User.objects.filter(username=u["username"]).exists():
        User.objects.create_user(**u)
        print(f"Created: {u['username']} ({u['role']})")
    else:
        print(f"Exists:  {u['username']}")
