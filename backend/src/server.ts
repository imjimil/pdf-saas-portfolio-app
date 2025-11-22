// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import authRoutes from './routes/auth';
import pdfRoutes from './routes/pdf';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mypdftools API is running' });
});

// Start server first, then connect to MongoDB (so server starts even if MongoDB is down)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Connect to MongoDB
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mypdftools')
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.warn('Server is running but MongoDB is not connected. Some features may not work.');
    });
});

export default app;

