# ---- Build stage -------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

RUN npm prune --omit=dev


# ---- Runtime stage -----------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/node

# Document engines:
#   libreoffice-*-nogui  Word <-> PDF with real layout fidelity (draw supplies
#                        the PDF import filter used by the PDF -> Word fallback)
#   ghostscript          genuine PDF compression, not just re-saving
#   qpdf                 AES-256 encryption and permissions
#   poppler-utils        layout-preserving text extraction and rasterization
#   tesseract-ocr        local OCR, so scans never leave this server
#   libglib2.0-0         required at runtime by opencv, a pdf2docx dependency
RUN apt-get update && apt-get install -y --no-install-recommends \
      libreoffice-core-nogui \
      libreoffice-writer-nogui \
      libreoffice-draw-nogui \
      ghostscript \
      qpdf \
      poppler-utils \
      tesseract-ocr \
      tesseract-ocr-eng \
      fonts-liberation \
      fonts-dejavu-core \
      fontconfig \
      libglib2.0-0 \
      python3 \
      python3-pip \
    && rm -rf /var/lib/apt/lists/*

# pdf2docx reconstructs paragraphs and tables, giving genuinely editable Word
# output. Optional by design: pdfToWordService falls back to LibreOffice and
# then to pure JavaScript, so a failure here degrades quality but not function.
RUN pip3 install --no-cache-dir --break-system-packages pdf2docx==0.5.8 \
      || echo 'pdf2docx unavailable - PDF to Word will fall back to LibreOffice'

RUN fc-cache -f

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN mkdir -p /home/node/.config /home/node/.cache \
    && chown -R node:node /home/node /app

USER node

# Create the LibreOffice profile now so the first user request does not pay the
# one-off cost of building it.
RUN soffice --headless --norestore --nofirststartwizard \
      -env:UserInstallation=file:///home/node/.lo-profile \
      --terminate_after_init > /dev/null 2>&1 || true

ENV PORT=10000
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||10000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
