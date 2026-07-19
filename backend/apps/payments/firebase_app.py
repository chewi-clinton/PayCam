"""
backend/apps/payments/firebase_app.py

Initializes the Firebase Admin SDK once per process using a service
account JSON file. Other modules import `get_firebase_app()` before
calling firebase_admin.messaging.send(...).

Required setting:
    FIREBASE_CREDENTIALS_PATH — absolute path to the service account
    JSON file, e.g. /etc/paycam/firebase-service-account.json

This file should NOT be committed to the repo. Mount it as a secret /
volume in Dokploy and point FIREBASE_CREDENTIALS_PATH at it via env var.
"""
import logging
import firebase_admin
from firebase_admin import credentials
from django.conf import settings

logger = logging.getLogger(__name__)

_firebase_app = None


def get_firebase_app():
    """
    Lazily initializes and returns the Firebase app singleton.
    Returns None if credentials are missing/invalid so callers can
    degrade gracefully instead of crashing the whole process.
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    cred_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", None)
    if not cred_path:
        logger.error(
            "FIREBASE_CREDENTIALS_PATH not set — FCM push notifications disabled."
        )
        return None

    try:
        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized.")
    except FileNotFoundError:
        logger.error(f"Firebase credentials file not found at {cred_path}")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return None

    return _firebase_app
