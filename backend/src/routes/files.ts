import express, { Response } from 'express';
import File from '../models/File';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = express.Router();

// Middleware to require authentication (not guest)
const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: express.NextFunction
) => {
  if (!req.userId || req.isGuest) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Get user's file processing history (paginated)
router.get(
  '/history',
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Optional filters
      const operation = req.query.operation as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      // Build query
      const query: any = { userId };
      if (operation) {
        query.operation = operation;
      }
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      // Get files and total count
      const [files, total] = await Promise.all([
        File.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        File.countDocuments(query),
      ]);

      res.json({
        files,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching file history:', error);
      res.status(500).json({ message: 'Failed to fetch file history' });
    }
  }
);

// Get specific file details
router.get(
  '/:id',
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const file = await File.findOne({
        _id: req.params.id,
        userId,
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.json(file);
    } catch (error: any) {
      console.error('Error fetching file:', error);
      res.status(500).json({ message: 'Failed to fetch file' });
    }
  }
);

// Delete file from history
router.delete(
  '/:id',
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const file = await File.findOne({
        _id: req.params.id,
        userId,
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      await File.deleteOne({ _id: file._id, userId });

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  }
);

/**
 * Processed files are streamed to the user and deleted immediately; nothing is
 * stored on the server. History is a record of what was converted, not a file
 * cabinet, so re-downloading is intentionally unavailable.
 */
router.get('/:id/download', authenticate, (_req: AuthRequest, res: Response) => {
  res.status(410).json({
    message: 'Files are deleted from our servers right after you download them.',
    hint: 'Upload the original file again to create a new copy.',
    code: 'FILE_NOT_RETAINED',
  });
});

export default router;

