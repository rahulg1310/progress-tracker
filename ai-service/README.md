# Kairo AI Service

FastAPI service that powers Coach. It is **private**: only the Express backend calls it, using a short-lived service token signed with `SERVICE_AUTH_SECRET`. The browser never talks to it directly.

Coach is a tool-calling agent (Gemini function calling, manual loop). It reads the player's games and sessions directly from MongoDB (read-only, always filtered by the verified user id) and asks Express `/internal/*` to make changes, so every write goes through Express validation. Statistics and plan progress are computed in Python (`app/domain`), never by the model.

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
| POST | `/v1/actions/{id}/confirm` | Apply a pending change Coach proposed |
| POST | `/v1/actions/{id}/cancel` | Discard a pending change |
| POST | `/v1/actions/{id}/undo` | Undo a session Coach logged (within 5 minutes) |
| GET | `/v1/plans` | Quest plans with progress from real sessions |
| POST | `/v1/plans` | Create a quest plan |
| POST | `/v1/plans/{id}/replan` | Spread the remaining time over the days left |
| DELETE | `/v1/plans/{id}` | Delete a plan |
| GET | `/v1/overview` | Insights, goals, briefing and plans in one request |
| GET | `/v1/insights` | Weekly and monthly progress summaries |
| GET / POST / DELETE | `/v1/goals` | Player goals with progress from sessions |
| GET | `/v1/briefing` | Today's dashboard briefing (cached per day) |
| POST | `/v1/recommendations` | Game recommendations from RAWG data |

## Agent tools

`get_library`, `find_game`, `get_sessions`, `get_stats`, `log_session` (runs immediately, undoable), `update_game` and `delete_session` (Confirm card only), `save_memory`, `create_quest_plan`, `get_quest_plans`, `get_goals`, `create_goal`, `recommend_games`.

## How numbers stay honest

- Statistics, streaks, goal progress and plan milestones are computed in `app/domain` from the player's records. They are recomputed on every request, so undo/delete can never leave stale counters.
- Coach only writes words: the briefing text is rejected unless every number in it appears in the computed facts.
- Discover scores RAWG games by overlap with the genres and tags of games the player loved and explains each pick with those overlaps.
