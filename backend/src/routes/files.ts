import express, { Response } from 'express';
import File from '../models/File';
import { AuthRequest, authenticate } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';

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

      // Try to delete the physical file if it exists
      if (file.processedFileName) {
        const filePath = path.join(
          process.cwd(),
          'uploads',
          file.processedFileName
        );
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
        } catch (err) {
          // File doesn't exist or already deleted, continue
          console.log('File not found on disk, continuing with deletion');
        }
      }

      await File.deleteOne({ _id: file._id, userId });

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  }
);

// Re-download processed file
router.get(
  '/:id/download',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const fileId = req.params.id;
      const userId = req.userId;

      // Find file - allow access if user owns it OR if it's a recent OCR file (for guests)
      const file = await File.findOne({
        _id: fileId,
        ...(userId ? { userId } : {}), // If authenticated, must be owner
      });

      // For guests, allow download if file was created recently (within last hour) and is OCR
      if (!file && !userId) {
        // Try to find recent OCR files for guests (created within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentFile = await File.findOne({
          _id: fileId,
          operation: 'ocr',
          createdAt: { $gte: oneHourAgo },
        });
        
        if (recentFile) {
          const filePath = path.join(
            process.cwd(),
            'uploads',
            recentFile.processedFileName
          );
          try {
            await fs.access(filePath);
            res.download(filePath, recentFile.originalFileName);
            return;
          } catch (err) {
            return res.status(404).json({
              message: 'File no longer available for download',
            });
          }
        }
      }

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // For authenticated users, verify ownership
      if (userId && file.userId?.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if file exists on disk
      const filePath = path.join(
        process.cwd(),
        'uploads',
        file.processedFileName
      );

      try {
        await fs.access(filePath);
        res.download(filePath, file.originalFileName);
      } catch (err) {
        res.status(404).json({
          message: 'File no longer available for download',
        });
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: 'Failed to download file' });
    }
  }
);

export default router;

