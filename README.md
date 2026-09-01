# Mypdftools

A PDF toolkit — convert, compress, merge, split, protect and OCR — built as a
React frontend and a Node/Express API.

Files are processed on the server and deleted the moment they are downloaded.
Nothing is retained.

---

## Why there is a Docker image

Serious PDF work cannot be done in pure JavaScript. Word documents need a real
layout engine, compression needs real image re-encoding, and encryption needs a
real crypto implementation. The API image therefore bundles:

- **LibreOffice** — Word ⇄ PDF at full fidelity
- **Ghostscript** — genuine compression
- **qpdf** — AES-256 encryption
- **Poppler** — layout-preserving text extraction
- **Tesseract** — on-server OCR
- **pdf2docx** — PDF → editable Word

Every service detects at runtime which engines exist and falls back to a
JavaScript implementation when one is missing, so local development works
without installing any of them — at reduced fidelity. `GET /api/health` reports
what the running server can actually do.

---

## Running locally

### Requirements

- Node.js 20+
- A MongoDB connection string (accounts and history only — the tools work without it)

### Backend

```bash
cd backend
npm install
cp .env.example .env    # then fill in the values
npm run dev             # http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # http://localhost:3000
```

The dev server also prints a `Network:` address (something like
`http://192.168.1.20:3000`). Open that on your phone, on the same Wi-Fi, to test
the mobile layout on a real device.

### Full fidelity locally (optional, macOS)

```bash
brew install --cask libreoffice
brew install ghostscript qpdf poppler tesseract
pip3 install pdf2docx
```

Restart the API and check `/api/health` — the capabilities should flip to `true`.

### Running against the real engines with Docker

```bash
cd backend
docker build -t mypdftools-api .
docker run --rm -p 5001:10000 --env-file .env -e PORT=10000 mypdftools-api
```

---

## Environment variables

### `backend/.env`

| Key | Required | Notes |
| --- | --- | --- |
| `PORT` | no | Defaults to 5000; use 5001 locally (macOS AirPlay owns 5000) |
| `MONGODB_URI` | no | Without it, accounts and history are disabled |
| `JWT_SECRET` | yes | Any long random string |
| `SESSION_SECRET` | yes | Any long random string |
| `FRONTEND_URL` | yes | Origin allowed by CORS |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | no | Google sign-in |
| `OCR_SPACE_API_KEY` | no | Cloud OCR fallback when Tesseract is absent |
| `MAX_UPLOAD_MB` | no | Defaults to 50 |

### `frontend/.env`

| Key | Notes |
| --- | --- |
| `VITE_API_URL` | `/api` locally, so requests go through the Vite proxy and keep working from a phone. In production set the full backend URL. Inlined at build time — rebuild after changing it. |

---

## Testing the tools

With the API running:

```bash
cd backend
node scripts/smoke-test.js
```

This generates real PDFs, Word files and images, exercises every endpoint, and
asserts the outputs are valid — that PDF → Word really returns a `.docx`, that
compression never returns a larger file, that splitting returns every page, and
that bad input produces a specific error rather than a generic 500.

---

## Project layout

```
backend/
  src/
    lib/           workspace/temp management, subprocess runner, errors, PDF helpers
    services/
      engines/     wrappers around LibreOffice, Ghostscript, qpdf, Poppler, Tesseract
      *.ts         one service per tool, each with a native path and a JS fallback
    routes/        pdf, auth, files, analytics
    middleware/    auth, upload, error handling
  Dockerfile

frontend/
  src/
    components/    AppShell, Navigation, TabBar, Dropzone, ToolShell, ui primitives
    pages/         landing, tool screens, account screens
    lib/tools.ts   the single tool registry every surface reads from
    services/api.ts
```

---

## Deployment

- **API** → Render, as a Docker service. See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).
- **Frontend** → Vercel. Set `VITE_API_URL` to the Render URL, and set
  `FRONTEND_URL` on Render back to the Vercel origin so CORS passes.
