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
import fileRoutes from './routes/files';
import analyticsRoutes from './routes/analytics';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mypdftools API is running' });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server first, then connect to MongoDB (so server starts even if MongoDB is down)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mypdftools';
  
  // Log connection attempt (mask password for security)
  const maskedUri = mongoUri.replace(/:[^:@]+@/, ':****@');
  console.log('Attempting to connect to MongoDB:', maskedUri);
  
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('✓ Connected to MongoDB successfully');
    })
    .catch((error) => {
      console.error('✗ MongoDB connection error:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
        console.error('\n⚠️  AUTHENTICATION ERROR - Common fixes:');
        console.error('   1. Check username and password are correct');
        console.error('   2. If password has special characters (@, #, %, etc.), URL-encode them');
        console.error('   3. Example: @ becomes %40, # becomes %23');
        console.error('   4. Use https://www.urlencoder.org/ to encode your password');
        console.error('   5. Or create a new user with a simple password (letters/numbers only)');
        console.error('\n   See MONGODB_TROUBLESHOOTING.md for detailed help\n');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.error('\n⚠️  NETWORK ERROR - Common fixes:');
        console.error('   1. Check your internet connection');
        console.error('   2. Verify MongoDB Atlas cluster is running');
        console.error('   3. Check Network Access in MongoDB Atlas allows your IP');
        console.error('   4. Try adding 0.0.0.0/0 to allow all IPs (for development)\n');
      } else if (error.message.includes('timeout')) {
        console.error('\n⚠️  TIMEOUT ERROR - Common fixes:');
        console.error('   1. Check Network Access in MongoDB Atlas');
        console.error('   2. Verify your IP is whitelisted');
        console.error('   3. Try again in a few minutes\n');
      }
      
      console.warn('Server is running but MongoDB is not connected. Some features may not work.');
    });
});

export default app;

