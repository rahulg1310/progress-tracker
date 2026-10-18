# Kairo AI Service

FastAPI service that powers Coach. It is **private**: only the Express backend calls it, using a short-lived service token signed with `SERVICE_AUTH_SECRET`. The browser never talks to it directly.

## Run locally (Windows PowerShell)

```powershell
cd ai-service
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env   # then fill in the values marked YOU SUPPLY
uvicorn app.main:app --reload --port 8000
```

- `GET http://127.0.0.1:8000/health` returns `{"status":"ok",...}`
- Interactive docs (development only): http://127.0.0.1:8000/docs

## Test

```powershell
pytest                     # unit tests, no database or Gemini key needed
$env:TEST_MONGO_URI="mongodb://127.0.0.1:27017"; pytest -m mongo   # optional, needs a local MongoDB
```

## Endpoints (all `/v1/*` require the Express service token)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Public liveness check |
| GET | `/v1/health` | Database and Gemini status |
| POST | `/v1/chat` | Send a message, get Coach's reply (creates a conversation if needed) |
| GET | `/v1/conversations` | Your conversations, newest first |
| GET | `/v1/conversations/{id}/messages` | Messages in one conversation |
| DELETE | `/v1/conversations/{id}` | Delete a conversation and its messages |
| GET | `/v1/memories` | What Coach remembers about you |
| DELETE | `/v1/memories/{id}` | Forget one memory |
