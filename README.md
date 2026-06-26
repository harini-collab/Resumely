# Resumely - AI Career Intelligence Platform

A full-stack web application that analyzes resumes, matches job roles, and provides AI-powered career feedback built with React, Node.js, MongoDB Atlas, and Groq AI (LLaMA 3).

---

## Features

- Resume Upload and Parsing - Upload PDF resumes and extract skills, experience, and education automatically
- AI Resume Analysis - Get AI-powered scores, feedback, and improvement suggestions powered by LLaMA 3 via Groq
- Job Role Matching - Match your resume against multiple job roles and see your fit percentage
- Dashboard and Progress Tracking - Visual charts showing resume score trends over time
- Resume Comparator - Compare two resumes side by side with AI insights
- AI Bullet Rewriter - Rewrite weak resume bullet points into strong, impactful ones
- Secure Authentication - JWT-based login, signup, forgot password, and password reset
- Responsive Design - Works on desktop and mobile

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 18, React Router v6, Recharts, Axios          |
| Backend    | Node.js, Express.js                                 |
| Database   | MongoDB Atlas with Mongoose                         |
| AI         | Groq SDK with LLaMA 3 (llama3-8b-8192) - Free tier |
| Auth       | JWT (JSON Web Tokens) and bcryptjs                  |
| File       | Multer and pdf-parse                                |
| Storage    | Cloudinary (optional) or local /tmp                 |
| Deployment | Vercel (frontend) and Render (backend)              |

---

## Project Structure

```
resumely-local/
├── backend/
│   ├── config/
│   │   ├── database.js        MongoDB Atlas connection with fallback
│   │   ├── dnsPatch.js        DNS settings for Atlas connectivity
│   │   ├── env.js             Environment variable validation
│   │   └── jobRoles.js        Job role definitions for matching
│   ├── controllers/
│   │   └── resumeController.js  Core resume analysis logic
│   ├── middleware/
│   │   └── auth.js            JWT authentication middleware
│   ├── models/
│   │   ├── User.js            User schema
│   │   └── Resume.js          Resume schema
│   ├── routes/
│   │   ├── auth.js            Login, signup, password reset routes
│   │   ├── resume.js          Upload, analyze, compare routes
│   │   └── career.js          Job match and career insight routes
│   ├── services/
│   │   ├── openaiService.js   Groq AI integration (LLaMA 3)
│   │   ├── pdfService.js      PDF text extraction
│   │   ├── emailService.js    Email for password reset
│   │   └── cloudStorageService.js  Cloudinary integration
│   ├── utils/
│   │   ├── resumeParser.js    Resume text parser
│   │   └── scoringEngine.js   Resume scoring logic
│   ├── app.js                 Express app setup
│   ├── server.js              Server entry point
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AIBot.js       AI chat assistant component
│       │   ├── ScoreRing.js   Circular score display
│       │   └── StatCard.js    Stats card component
│       ├── context/
│       │   └── AuthContext.js Global auth state
│       ├── layouts/
│       │   └── AppLayout.js   App shell and navigation
│       ├── pages/
│       │   ├── Home.js        Landing page
│       │   ├── Login.js       Login page
│       │   ├── Signup.js      Signup page
│       │   ├── Dashboard.js   Main dashboard with charts
│       │   ├── Upload.js      Resume upload page
│       │   ├── JobMatch.js    Job matching page
│       │   ├── CareerMatch.js Career intelligence page
│       │   ├── Comparator.js  Resume comparator
│       │   ├── Progress.js    Progress tracking
│       │   ├── Profile.js     User profile
│       │   ├── Settings.js    Account settings
│       │   ├── ForgotPassword.js  Forgot password page
│       │   └── ResetPassword.js   Reset password page
│       ├── services/
│       │   └── api.js         Axios API service layer
│       ├── App.js             Routes setup
│       └── index.js           React entry point
│
├── scripts/
│   └── npm-in-dir.js          Helper for running npm in subdirectories
├── package.json               Root scripts for running both servers


```

---

## Run Locally

### Prerequisites

- Node.js v18 or higher
- MongoDB Atlas account (free) at mongodb.com/atlas
- Groq API key (free) at console.groq.com

### 1. Clone the repo

```bash
git clone https://github.com/harini-collab/Resumely.git
cd Resumely
```

### 2. Set up backend environment

Create a file called .env inside the backend folder with these values:

```
PORT=3500
NODE_ENV=development
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/resumely?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=any-random-string-minimum-32-characters-long
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=gsk_your_groq_api_key_here
OPENAI_MODEL=llama3-8b-8192
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
FRONTEND_URL=http://localhost:3001
REQUIRE_DB_ON_START=false
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/tmp/resumely-uploads
```

### 3. Set up frontend environment

Create a file called .env.development inside the frontend folder:

```
REACT_APP_API_URL=http://localhost:3500/api
```

### 4. Install dependencies

```bash
npm run install:all
```

### 5. Start the app

```bash
npm run dev
```

This starts both backend and frontend at the same time.

| Service      | URL                           |
|--------------|-------------------------------|
| Frontend     | http://localhost:3001          |
| Backend API  | http://localhost:3500          |
| Health Check | http://localhost:3500/health   |

---

## Available Scripts

From the root folder:

| Command               | What it does                          |
|-----------------------|---------------------------------------|
| npm run install:all   | Installs dependencies for both apps   |
| npm run dev           | Starts backend and frontend together  |
| npm run dev:backend   | Starts backend only                   |
| npm run dev:frontend  | Starts frontend only                  |
| npm run build:frontend| Builds frontend for production        |

---

