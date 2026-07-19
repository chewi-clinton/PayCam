# PayCam

PayCam is a mobile-first payments platform for Cameroon: a Django REST
backend handling mobile money (MTN/Orange), card, and crypto payments, and
a Flutter mobile app for end users.

## Repository layout

This repo is organized as three long-lived branches, each owning a
self-contained part of the product:

| Branch     | Contains                                                          |
|------------|--------------------------------------------------------------------|
| `main`     | Shared root files: this README, `.gitignore`, `secrets/` template |
| `backend`  | Django REST API — `backend/`                                      |
| `frontend` | Client apps — `frontend/mobile_app/` (Flutter), `frontend/web/` (planned Next.js admin dashboard) |

Check out the branch you need:

```bash
git checkout backend    # API work
git checkout frontend   # mobile app / admin dashboard work
```

## Backend (`backend` branch)

Django + DRF, with Celery for async work, Redis for OTP/rate-limiting/
idempotency, and Postgres/RabbitMQ via Docker Compose.

```bash
git checkout backend
cd backend
cp .env.example .env   # fill in real values, see "Secrets" below
docker compose up --build
```

Apps:

- `paycam_auth` — merchant JWT + API key authentication
- `mobile_app` — mobile user auth, wallet, transactions, change-PIN
- `payments` — MoMo, card, and crypto payment initiation
- `cards`, `crypto` — payment-method-specific logic
- `webhooks` — signed outbound event delivery
- `sandbox` — merchant testing environment
- `dashboard` — merchant dashboard websocket feed
- `common` — shared throttling, error handling, health check

Run tests: `python manage.py test`

## Mobile app (`frontend` branch)

Flutter app matching the PayCam brand (`#48B836` green, black, white),
with English/French localization and light/dark theming.

```bash
git checkout frontend
cd frontend/mobile_app
flutter pub get
flutter run
```

The app can run against the live backend or in an offline **demo mode**
(no login required) that exercises every screen with mock data — useful
for design review without a backend running.

Run the on-device integration suite: `flutter test integration_test`

## Secrets

Nothing under `secrets/` is ever committed except the `.example.json`
placeholder. To set up locally:

1. Download your Firebase service-account key from the Firebase console
   (Project settings → Service accounts → Generate new private key).
2. Save it as `secrets/firebase-service-account.json` — see
   `secrets/firebase-service-account.example.json` for the exact shape
   expected.
3. Point the backend at it in `backend/.env`:
   ```
   FIREBASE_CREDENTIALS_PATH=secrets/firebase-service-account.json
   ```

Real credentials, `.env` files, and anything else under `secrets/` are
covered by the root `.gitignore` and must never be committed.
