# 🚀 Resumely — Run Locally in 2 Steps

## STEP 1 — Install dependencies
Open terminal in this folder and run:
```bash
npm run install:all
```

## STEP 2 — Start the app
```bash
npm run dev
```

## ✅ Open in browser:
- **App →** http://localhost:3001
- **Backend health →** http://localhost:3500/health

---

## ⚠️ If you reset your MongoDB password:
Open `backend/.env` and update this line:
```
MONGODB_URI=mongodb+srv://suryaharini127_db_user:NEW_PASSWORD@cluster0.gt9wanu.mongodb.net/resumely?retryWrites=true&w=majority&appName=Cluster0
```

## Push to GitHub:
```bash
git add .
git commit -m "your message"
git push origin main
```
> ✅ `.env` is gitignored — your secrets are never pushed!
