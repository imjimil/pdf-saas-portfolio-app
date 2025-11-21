import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';

const router = express.Router();

// Configure Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ email: profile.emails?.[0]?.value });
          
          if (user) {
            // User exists, return user
            return done(null, user);
          } else {
            // Create new user
            user = new User({
              email: profile.emails?.[0]?.value,
              googleId: profile.id,
              name: profile.displayName,
              // No password for OAuth users
            });
            await user.save();
            return done(null, user);
          }
        } catch (error: any) {
          return done(error, undefined);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not found. Google OAuth is disabled.');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = new User({ 
      email: email.toLowerCase().trim(), 
      password: password 
    });
    
    // Mark password as modified to ensure it gets hashed
    user.markModified('password');
    
    try {
      await user.save();
    } catch (saveError: any) {
      console.error('Save error:', saveError);
      // Handle validation errors
      if (saveError.name === 'ValidationError') {
        const errorMessages = Object.values(saveError.errors).map((err: any) => err.message);
        return res.status(400).json({ message: errorMessages.join(', ') });
      }
      // Handle duplicate key error (email already exists)
      if (saveError.code === 11000) {
        return res.status(400).json({ message: 'User already exists' });
      }
      throw saveError;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user (normalize email)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user has a password (not an OAuth-only user)
    if (!user.password) {
      return res.status(401).json({ message: 'This account was created with Google. Please sign in with Google.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// Google OAuth routes (only if OAuth is configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    async (req: any, res: Response) => {
      try {
        const user = req.user;
        
        // Generate token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}`);
      } catch (error: any) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
      }
    }
  );
} else {
  // Return error if OAuth is not configured
  router.get('/google', (req: Request, res: Response) => {
    res.status(503).json({ message: 'Google OAuth is not configured' });
  });
  
  router.get('/google/callback', (req: Request, res: Response) => {
    res.status(503).json({ message: 'Google OAuth is not configured' });
  });
}

export default router;

