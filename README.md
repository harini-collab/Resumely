# Resumely — AI Career Intelligence Platform

Full-stack resume analysis app: **React frontend** + **Node/Express backend** + **MongoDB Atlas**.

---

## Local development

### 1. Install dependencies

From the project root (`resumely_fixed/`):

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.development
```

Edit `backend/.env` with your MongoDB Atlas URI, JWT secret, and OpenAI key.

### 3. Start backend (Terminal 1)

```bash
cd backend
npm run dev
```

Backend: **http://localhost:5000** — health check at `/health`

### 4. Start frontend (Terminal 2)

```bash
cd frontend
npm start
```

Frontend: **http://localhost:3001**

### Optional: run both with one command

```bash
npm install          # root — installs concurrently
npm run dev
```

---

## Production deployment (Render + Vercel)

Deploy the **backend on Render** and the **frontend on Vercel**. MongoDB lives on **MongoDB Atlas** (free tier works).

```
┌─────────────┐     HTTPS      ┌──────────────┐     HTTPS      ┌─────────────┐
│   Vercel    │ ──────────────▶│    Render    │ ──────────────▶│   MongoDB   │
│  (React)    │   API calls    │  (Express)   │   MONGODB_URI  │   Atlas     │
└─────────────┘                └──────────────┘                └─────────────┘
```

### Step 0 — Push code to GitHub

The git repo root is this folder (`resumely_fixed/`). Do **not** push `node_modules/`, `.env` files, or `build/`.

```bash
git add .
git commit -m "Production-ready deployment config"
git push origin main
```

---

### Step 1 — MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user (username + password).
3. **Network Access** → Add IP `0.0.0.0/0` (allows Render’s dynamic IPs).
4. Copy the connection string, e.g.:
   ```
   mongodb+srv://USER:PASS@cluster.mongodb.net/resumely
   ```

---

### Step 2 — Deploy backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**.
2. Connect your GitHub repo.
3. Settings:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `backend` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Health Check Path** | `/health` |

4. Add **Environment Variables** (see `backend/.env.example`):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | 64+ char random string (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
   | `ALLOWED_ORIGINS` | Your Vercel URL (set after Step 3), e.g. `https://resumely.vercel.app` |
   | `FRONTEND_URL` | Same Vercel URL |
   | `OPENAI_API_KEY` | Your OpenAI key |
   | `REQUIRE_DB_ON_START` | `true` |
   | `CLOUDINARY_CLOUD_NAME` | (optional) |
   | `CLOUDINARY_API_KEY` | (optional) |
   | `CLOUDINARY_API_SECRET` | (optional) |

5. Click **Create Web Service**. Note your backend URL, e.g.:
   ```
   https://resumely-backend.onrender.com
   ```

6. Verify: open `https://resumely-backend.onrender.com/health` — should return `"status": "healthy"`.

**Alternative:** use the included `render.yaml` blueprint (**New → Blueprint** → point at repo).

---

### Step 3 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the same GitHub repo.
3. Settings:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | Create React App |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `build` |

4. **Environment Variables** (must be set **before** the first build):

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://resumely-backend.onrender.com/api` |

5. Deploy. Note your frontend URL, e.g.:
   ```
   https://resumely.vercel.app
   ```

6. `vercel.json` is included for client-side routing (React Router).

---

### Step 4 — Link frontend ↔ backend (CORS)

Go back to **Render → your backend → Environment** and update:

```
ALLOWED_ORIGINS=https://resumely.vercel.app
FRONTEND_URL=https://resumely.vercel.app
```

Replace with your actual Vercel URL. Render will redeploy automatically.

---

### Step 5 — Smoke test

1. Open your Vercel URL.
2. Sign up / log in.
3. Upload a resume and run analysis.
4. If API calls fail, check:
   - `REACT_APP_API_URL` was set in Vercel **before** build (redeploy after changing it).
   - `ALLOWED_ORIGINS` on Render matches your Vercel URL exactly (no trailing slash).
   - Render backend `/health` shows `"database": { "state": "connected" }`.

---

## Environment variable reference

| File | Purpose |
|------|---------|
| `backend/.env.example` | All backend variables with descriptions |
| `frontend/.env.example` | Frontend API URL |

Never commit `.env` files — they are gitignored.

---

## Tech stack

- **Frontend:** React 18, React Router v6, Recharts, Axios
- **Backend:** Node.js, Express, MongoDB Atlas, OpenAI API
- **Auth:** JWT
- **Storage:** Cloudinary (optional) or local `/tmp`
