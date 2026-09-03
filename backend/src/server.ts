// Environment must load before any module reads process.env at import time.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';

import authRoutes from './routes/auth';
import pdfRoutes from './routes/pdf';
import fileRoutes from './routes/files';
import contactRoutes from './routes/contact';
import analyticsRoutes from './routes/analytics';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logCapabilities } from './lib/binaries';
import { SESSION_SECRET } from './lib/config';
import { sweepStaleWorkspaces } from './lib/workspace';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use(
  helmet({
    // Responses are JSON and file downloads, never embedded HTML.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());

// The deployed frontend plus local dev servers.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests and curl send no Origin header.
      if (!origin) return callback(null, true);

      const allowed =
        allowedOrigins.includes(origin) ||
        // Vercel preview deployments of this project.
        /^https:\/\/[\w-]+\.vercel\.app$/.test(origin);

      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Conversions are CPU-heavy, so they get a tighter budget than reads.
const conversionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'You have made a lot of requests. Please wait a few minutes and try again.',
    code: 'RATE_LIMITED',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: 'Too many attempts. Please wait a few minutes and try again.',
    code: 'RATE_LIMITED',
  },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'You have sent several messages recently. Please try again later.',
    code: 'RATE_LIMITED',
  },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/pdf', conversionLimiter, pdfRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (_req, res) => {
  res.sendStatus(200);
});

app.get('/', (_req, res) => {
  res.json({ name: 'Mypdftools API', health: '/api/health' });
});

app.use(notFoundHandler);
app.use(errorHandler);

// Listen first so the platform health check passes even if Mongo is slow.
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server listening on port ${PORT}`);

  await logCapabilities();

  await sweepStaleWorkspaces();
  setInterval(() => void sweepStaleWorkspaces(), 60 * 60 * 1000).unref();

  await connectToDatabase();
});

async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      'MONGODB_URI is not set. Accounts and history are disabled; conversions still work.'
    );
    return;
  }

  console.log('Connecting to MongoDB:', uri.replace(/:[^:@]+@/, ':****@'));

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('MongoDB connection failed:', message);

    if (/bad auth|authentication failed/i.test(message)) {
      console.error(
        'Check the username and password in MONGODB_URI. Special characters must be percent-encoded.'
      );
    } else if (/ENOTFOUND|getaddrinfo|querySrv/i.test(message)) {
      console.error(
        'The cluster hostname could not be resolved. Confirm MONGODB_URI is the real connection string, not the placeholder.'
      );
    } else if (/timed out/i.test(message)) {
      console.error(
        'Connection timed out. In MongoDB Atlas, allow 0.0.0.0/0 under Network Access.'
      );
    }

    console.warn('Running without a database. Conversions work; accounts do not.');
  }
}

export default app;
