import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ContactMessage from '../models/ContactMessage';
import { sendContactNotification } from '../lib/mail';
import { AppError } from '../lib/errors';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const message = String(req.body?.message ?? '').trim();

    if (!name) {
      throw new AppError('INVALID_INPUT', 'Please tell us your name.');
    }
    if (!email || !EMAIL_RE.test(email)) {
      throw new AppError('INVALID_INPUT', 'Enter a valid email address.');
    }
    if (message.length < 10) {
      throw new AppError(
        'INVALID_INPUT',
        'A little more detail helps us answer properly.'
      );
    }

    if (mongoose.connection.readyState !== 1) {
      throw new AppError(
        'SERVICE_UNAVAILABLE',
        'Contact form is temporarily unavailable.',
        'Email us directly at the address shown above.'
      );
    }

    await ContactMessage.create({
      name,
      email,
      message,
      userId: req.userId,
    });

    let emailed = false;
    try {
      emailed = await sendContactNotification({ name, email, message });
    } catch (error) {
      console.warn(
        'Contact email failed (message was saved):',
        error instanceof Error ? error.message : error
      );
    }

    res.json({
      ok: true,
      emailed,
      message: emailed
        ? 'Message sent — we will reply to your email soon.'
        : 'Message received — we will get back to you within a couple of days.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
