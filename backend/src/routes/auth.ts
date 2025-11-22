import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configure Google OAuth Strategy (only if credentials are provided)
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (googleClientId && googleClientSecret) {
  console.log('✓ Google OAuth credentials found. OAuth is enabled.');
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            console.error('Google OAuth: No email in profile');
            return done(new Error('No email found in Google profile'), undefined);
          }

          console.log('Google OAuth: Processing profile', { email, googleId: profile.id });
          
          // Check if user exists
          let user = await User.findOne({ email: email.toLowerCase().trim() });
          
          if (user) {
            // Update user with Google ID if not set
            if (!user.googleId) {
              user.googleId = profile.id;
              if (!user.name && profile.displayName) {
                user.name = profile.displayName;
              }
              await user.save();
            }
            console.log('Google OAuth: Existing user found', { email: user.email });
            return done(null, user);
          } else {
            // Create new user
            user = new User({
              email: email.toLowerCase().trim(),
              googleId: profile.id,
              name: profile.displayName || '',
              // No password for OAuth users
            });
            await user.save();
            console.log('Google OAuth: New user created', { email: user.email });
            return done(null, user);
          }
        } catch (error: any) {
          console.error('Google OAuth strategy error:', error);
          return done(error, undefined);
        }
      }
    )
  );
} else {
  console.warn('⚠ Google OAuth credentials not found. Google OAuth is disabled.');
  console.warn(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
  console.warn(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
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
if (googleClientId && googleClientSecret) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req: any, res: Response) => {
      try {
        const user = req.user;
        
        if (!user) {
          console.error('OAuth callback: No user found');
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed: No user data')}`);
        }

        console.log('OAuth callback: User authenticated', { email: user.email, id: user._id });
        
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
        console.error('OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
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

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.isGuest) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
});

// Update user profile (name)
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.isGuest) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) {
      user.name = name;
      await user.save();
    }

    res.json({ message: 'Profile updated successfully', user: { id: user._id, email: user.email, name: user.name } });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.isGuest) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      return res.status(400).json({ message: 'This account was created with Google. Password cannot be changed.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.markModified('password');
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ message: error.message || 'Failed to change password' });
  }
});

// Delete account
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.isGuest) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's files from history
    const File = (await import('../models/File')).default;
    await File.deleteMany({ userId: req.userId });

    // Delete user's usage records
    const Usage = (await import('../models/Usage')).default;
    await Usage.deleteMany({ userId: req.userId });

    // Delete user account
    await User.deleteOne({ _id: req.userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete account' });
  }
});

export default router;

