# Mypdftools

A full-stack PDF processing SaaS application built with React and Node.js/Express. Features include PDF conversions, OCR, and document processing tools.

## Features

- **PDF to Word**: Convert PDF documents to editable Word files
- **Image to PDF**: Transform images into PDF documents
- **Split PDF**: Extract pages or split PDFs into multiple files
- **Merge PDF**: Combine multiple PDF files into one
- **Compress PDF**: Reduce PDF file size
- **PDF to Text**: Extract text content from PDF files
- **PDF to EPUB**: Convert PDFs to EPUB format for e-readers
- **PDF OCR**: Extract text from scanned PDFs using OCR technology
- **Authentication**: Secure user registration and login with Google OAuth
- **Guest Access**: Use the app without creating an account (3 free uses)
- **Dark Mode**: Toggle between light and dark themes
- **Landing Page**: Professional SaaS landing page with green/cream design

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS (custom green/cream theme)
- React Router
- Framer Motion (animations)
- Formik & Yup (form validation)
- Axios (API calls)

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Multer (file uploads)
- PDF processing libraries (pdf-lib, pdf-parse, etc.)
- Tesseract.js (OCR)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mypdftools
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-session-secret
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
mypdftools/
├── backend/
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # PDF processing services
│   │   ├── models/         # Mongoose models
│   │   ├── middleware/     # Auth middleware
│   │   └── server.ts       # Express server
│   └── uploads/            # Temporary file storage
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
│   └── public/
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### PDF Operations (Protected)
- `POST /api/pdf/to-word` - Convert PDF to Word
- `POST /api/pdf/image-to-pdf` - Convert image to PDF
- `POST /api/pdf/split` - Split PDF
- `POST /api/pdf/to-txt` - Convert PDF to text
- `POST /api/pdf/to-epub` - Convert PDF to EPUB
- `POST /api/pdf/ocr` - Extract text using OCR

## Design

The application features a minimal green and cream color scheme:
- **Green**: #10b981 (primary), #059669 (dark)
- **Cream**: #fefbf3 (light), #f5f5dc (base)

## License

MIT

