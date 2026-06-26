# Resumely - AI Career Intelligence Platform

An intelligent full-stack web app that analyzes resumes, matches job roles, and provides AI-powered career feedback using React, Node.js, MongoDB Atlas, and Groq AI (LLaMA 3).

---

## Features

- Resume Upload and Parsing - Upload PDF resumes and extract skills, experience, and education automatically
- AI Resume Analysis - Get AI-powered scores, feedback, and improvement suggestions powered by LLaMA 3
- Job Role Matching - Match your resume against 50+ job roles and see your fit percentage
- Dashboard and Progress Tracking - Visual charts showing resume score trends over time
- Resume Comparator - Compare two resumes side by side with AI insights
- AI Bullet Rewriter - Rewrite weak resume bullet points into strong, impactful ones
- Secure Authentication - JWT-based login, signup, and password reset
- Responsive Design - Works on desktop and mobile

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, React Router v6, Recharts, Axios      |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB Atlas (Mongoose ODM)                    |
| AI         | Groq API - LLaMA 3 (8B) - Free tier            |
| Auth       | JWT (JSON Web Tokens) + bcrypt                  |
| File       | Multer + pdf-parse                              |
| Deployment | Vercel (frontend) + Render (backend)            |

---

## Project Structure

```
resumely/
├── backend/
│   ├── config/           DB connection, env validation
│   ├── controllers/      Resume analysis logic
│   ├── middleware/       JWT auth middleware
│   ├── models/           Mongoose schemas (User, Resume)
│   ├── routes/           API routes (auth, resume, career)
│   ├── services/         AI (Groq), email, cloud storage
│   ├── utils/            Resume parser, scoring engine
│   └── server.js         Entry point
│
├── frontend/
│   └── src/
│       ├── components/   Reusable UI components
│       ├── context/      Auth context (global state)
│       ├── layouts/      App shell and navigation
│       ├── pages/        All page components
│       └── services/     Axios API service layer
│
└── package.json          Root scripts (install:all, dev)
```

---

## Run Locally

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free)
- Groq API key (free) at console.groq.com

### 1. Clone the repo
```bash
git clone https://github.com/harini-collab/Resumely.git
cd Resumely
```

### 2. Configure environment

Create backend/.env with the following:
```
PORT=3500
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/resumely?retryWrites=true&w=majority
JWT_SECRET=your-32-char-secret-key-here
OPENAI_API_KEY=gsk_your_groq_key_here
OPENAI_MODEL=llama3-8b-8192
ALLOWED_ORIGINS=http://localhost:3001
FRONTEND_URL=http://localhost:3001
REQUIRE_DB_ON_START=false
```

Create frontend/.env.development with the following:
```
REACT_APP_API_URL=http://localhost:3500/api
```

### 3. Install and run
```bash
npm run install:all
npm run dev
```

| Service      | URL                          |
|--------------|------------------------------|
| Frontend     | http://localhost:3001         |
| Backend      | http://localhost:3500         |
| Health Check | http://localhost:3500/health  |

---




