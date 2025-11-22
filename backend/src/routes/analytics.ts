import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Usage from '../models/Usage';
import File from '../models/File';

const router = express.Router();

// Middleware to require authentication
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

// Get user usage statistics
router.get(
  '/usage',
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get date range (default to last 30 days)
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get usage records
      const usageRecords = await Usage.find({
        userId,
        date: { $gte: startDate },
      }).sort({ date: 1 });

      // Aggregate by date
      const dailyUsage: { [key: string]: { date: string; fileCount: number; totalSize: number } } = {};
      
      usageRecords.forEach((record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!dailyUsage[dateKey]) {
          dailyUsage[dateKey] = {
            date: dateKey,
            fileCount: 0,
            totalSize: 0,
          };
        }
        dailyUsage[dateKey].fileCount += record.fileCount;
        dailyUsage[dateKey].totalSize += record.totalFileSize;
      });

      // Convert to array
      const dailyUsageArray = Object.values(dailyUsage);

      // Get total statistics
      const totalFiles = await File.countDocuments({ userId });
      const totalSizeResult = await File.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
      ]);
      const totalSize = totalSizeResult[0]?.totalSize || 0;

      res.json({
        dailyUsage: dailyUsageArray,
        totalFiles,
        totalSize,
        period: days,
      });
    } catch (error: any) {
      console.error('Error fetching usage analytics:', error);
      res.status(500).json({ message: 'Failed to fetch usage analytics' });
    }
  }
);

// Get operation breakdown
router.get(
  '/operations',
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get date range (default to last 30 days)
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Aggregate by operation
      const operationStats = await Usage.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$operation',
            fileCount: { $sum: '$fileCount' },
            totalSize: { $sum: '$totalFileSize' },
          },
        },
        {
          $sort: { fileCount: -1 },
        },
      ]);

      res.json({
        operations: operationStats,
        period: days,
      });
    } catch (error: any) {
      console.error('Error fetching operation analytics:', error);
      res.status(500).json({ message: 'Failed to fetch operation analytics' });
    }
  }
);

export default router;

