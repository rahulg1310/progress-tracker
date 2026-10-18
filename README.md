from pathlib import Path

readme = r'''# Kairo 🎮

**Your personal gaming progress tracker.**

Kairo is a full-stack web application that helps gamers organize their game library, record gaming sessions, and keep track of their gaming journey in one place.

---

## ✨ Features

- **Game Library** — Keep your games organized in one personal library.
- **Game Management** — Add, update, and remove games from your collection.
- **Game Discovery** — Find games and display cover artwork using the RAWG API.
- **Search, Filter, and Sort** — Quickly find games in your library.
- **Gaming Sessions** — Record sessions and review your activity.
- **Dashboard** — View your gaming information and progress in one place.
- **Profile Management** — Manage your account and profile details.
- **Authentication** — Account authentication with JWT-based authorization and Google sign-in support.
- **Persistent Storage** — Store application data in MongoDB.

## 🛠️ Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, Vite, React Router |
| Styling | Tailwind CSS |
| API requests | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, Google OAuth |
| Game data and artwork | RAWG API |
| Deployment | Vercel (frontend), Render (backend) |

## 🧱 Project Structure

```text
progress-tracker/
├── frontend/    # React + Vite client
├── backend/     # Express API and database integration
├── .gitignore
└── README.md
```

## 🚀 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A [MongoDB Atlas](https://www.mongodb.com/atlas) database or local MongoDB instance
- API credentials for the external services you choose to use (such as Google OAuth and RAWG)

### 1. Clone the repository

```bash
git clone https://github.com/rahulg1310/progress-tracker.git
cd progress-tracker
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory and add the environment variables expected by the backend code. Typical settings include your MongoDB connection URI, JWT secret, and any OAuth or RAWG credentials required by the features you use.

**Do not commit your `.env` file or expose API keys, database credentials, or JWT secrets.** Use placeholder values in any example environment file.

Start the backend:

```bash
npm start
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

> **Environment configuration:** Check the existing frontend and backend configuration files for the exact environment-variable names and API URLs used by this project. Set the frontend API URL to your locally running backend when developing locally.

## 🔐 Security Notes

- Keep secrets and credentials in environment variables, never in frontend source code.
- Never commit `.env` files.
- Use a strong, private JWT secret.
- Validate requests and enforce authorization on the backend; never rely on a user ID supplied by the client to decide which records someone may access.

## 🧪 Useful Commands

From `frontend/`:

```bash
npm run dev
npm run build
npm run lint
```

From `backend/`:

```bash
npm start
npm test
```

## 🗺️ Future Improvements

Potential directions for Kairo include AI-powered gaming insights, personalized recommendations, goal planning, and a conversational gaming assistant.

## 👨‍💻 About

Kairo was built as a full-stack project to explore frontend development, REST API design, authentication, database integration, and deployment.

If you find the project interesting, feel free to explore the repository and share feedback.
'''
path = Path("/mnt/data/README.md")
path.write_text(readme, encoding="utf-8")
print(f"Created {path} ({len(readme.splitlines())} lines)")
