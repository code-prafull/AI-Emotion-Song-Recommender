# Deployment Guide

Follow these steps in order. Most "songs not recommended after deployment" issues come from steps 2 and 4.

## 1. Backend (e.g. Render / Railway)

Root directory: `backend`

| Setting | Value |
|---|---|
| Build command | `npm install` |
| Start command | `npm start` |

Environment variables (dashboard → Environment):

| Key | Required | Notes |
|---|---|---|
| `MONGODB_URL` | yes | MongoDB Atlas connection string |
| `IMAGEKIT_PUBLIC_KEY` | yes | for uploading songs |
| `IMAGEKIT_PRIVATE_KEY` | yes | |
| `IMAGEKIT_URL_ENDPOINT` | yes | e.g. `https://ik.imagekit.io/your-account` |
| `PORT` | no | set automatically by the platform |

Verify after deploy: open `https://your-backend.onrender.com/` — it must return
`{"status":"ok",...}`. Then test `https://your-backend.onrender.com/song?mood=happy`.

## 2. Frontend (e.g. Vercel / Netlify)

Root directory: `frontend`

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |

Environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | your backend URL, **no trailing slash**, e.g. `https://ai-emotion-song.onrender.com` |

> **Important:** Vite bakes `VITE_API_URL` into the bundle **at build time**.
> Adding/changing it in the dashboard requires a **redeploy** afterwards.
> If it is missing, the app would call `undefined/song?...` and silently fail —
> the app now shows this as a visible error in the playlist panel.

## 3. Camera / webcam requirement

Browsers only allow camera access in **secure contexts**: `https://` or `localhost`.
If you open the deployed site over plain `http://`, the camera will not start
(the app now shows this error explicitly).

## 4. Quick checklist when songs don't appear

1. `VITE_API_URL` set in frontend **build** env → redeployed?
2. Backend opens with `{"status":"ok"}` on `/`?
3. `MONGODB_URL` set in backend env → backend logs `DB CONNECTED`?
4. Database actually has songs? Test `GET /song` — empty array means no songs uploaded.
5. `GET /song?mood=happy` — the app falls back to all songs if the mood has none.

## Local development

```bash
# backend (port 3000)
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev

# frontend (port 5173)
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev
```
