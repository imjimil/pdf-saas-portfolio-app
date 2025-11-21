# PDF SaaS Backend

Backend API for PDF processing SaaS application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection:
```
MONGODB_URI=mongodb://localhost:27017/pdf-saas
JWT_SECRET=your-secret-key
PORT=5000
```

4. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on localhost:27017
# Or use MongoDB Atlas connection string
```

5. Run the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### PDF Operations (Requires Authentication)
- `POST /api/pdf/to-word` - Convert PDF to Word (text extraction)
- `POST /api/pdf/image-to-pdf` - Convert image to PDF
- `POST /api/pdf/split` - Split PDF into multiple files
- `POST /api/pdf/to-txt` - Extract text from PDF
- `POST /api/pdf/to-epub` - Convert PDF to EPUB
- `POST /api/pdf/ocr` - Extract text using OCR

All PDF endpoints require:
- Authentication token in header: `Authorization: Bearer <token>`
- File upload via multipart/form-data with field name `file`

