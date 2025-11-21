import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import pdfParse from 'pdf-parse';
import archiver from 'archiver';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PDFService } from '../services/pdfService';
import { OCRService } from '../services/ocrService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Use process.cwd() to get the backend directory, then create uploads folder
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
});

// Helper function to clean up files
const cleanupFiles = async (filePaths: string[]) => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

// PDF to Word
router.post(
  '/to-word',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const outputPath = req.file.path.replace('.pdf', '.txt');
      await PDFService.pdfToWord(req.file.path, outputPath);
      
      res.download(outputPath, 'extracted_text.txt', (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([req.file!.path, outputPath]);
      });
    } catch (error: any) {
      // If it's a text extraction (our custom message), still send the file
      if (error.message.includes('PDF to Word:')) {
        const txtPath = req.file.path.replace('.pdf', '.txt');
        try {
          const dataBuffer = await fs.readFile(req.file.path);
          const pdfData = await pdfParse(dataBuffer);
          await fs.writeFile(txtPath, pdfData.text || 'No text found');
          
          res.download(txtPath, 'extracted_text.txt', (err) => {
            if (err) {
              console.error('Download error:', err);
            }
            cleanupFiles([req.file!.path, txtPath]);
          });
        } catch (fallbackError: any) {
          cleanupFiles([req.file.path]);
          res.status(500).json({ message: error.message });
        }
      } else {
        cleanupFiles([req.file.path]);
        res.status(500).json({ message: error.message });
      }
    }
  }
);

// Image to PDF
router.post(
  '/image-to-pdf',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const outputPath = req.file.path.replace(path.extname(req.file.path), '.pdf');
      await PDFService.imageToPdf(req.file.path, outputPath);
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([req.file!.path, outputPath]);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

// Split PDF
router.post(
  '/split',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const { pageRanges } = req.body; // Optional: [{start: 1, end: 3}, {start: 4, end: 5}]
      const outputDir = path.join(path.dirname(req.file.path), 'split_' + Date.now());
      await fs.mkdir(outputDir, { recursive: true });

      const parsedRanges = pageRanges ? JSON.parse(pageRanges) : undefined;
      const outputFiles = await PDFService.splitPdf(req.file.path, outputDir, parsedRanges);

      if (outputFiles.length === 0) {
        cleanupFiles([req.file.path]);
        res.status(500).json({ message: 'Failed to split PDF' });
        return;
      }

      // Always send the single combined PDF file
      // (When pageRanges are specified, all pages are combined into one file)
      if (outputFiles.length > 0) {
        const fileName = parsedRanges ? 'split_pages.pdf' : path.basename(outputFiles[0]);
        res.download(outputFiles[0], fileName, async (err) => {
          if (err) {
            console.error('Download error:', err);
          }
          // Cleanup
          cleanupFiles([req.file!.path, ...outputFiles]);
          try {
            await fs.rm(outputDir, { recursive: true, force: true });
          } catch {}
        });
      }
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

// PDF to TXT
router.post(
  '/to-txt',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const outputPath = req.file.path.replace('.pdf', '.txt');
      await PDFService.pdfToTxt(req.file.path, outputPath);
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([req.file!.path, outputPath]);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

// PDF to EPUB
router.post(
  '/to-epub',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const outputPath = req.file.path.replace('.pdf', '.epub');
      await PDFService.pdfToEpub(req.file.path, outputPath);
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([req.file!.path, outputPath]);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

// PDF OCR
router.post(
  '/ocr',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const outputPath = req.file.path.replace('.pdf', '_ocr.txt');
      await OCRService.processPdfWithOcr(req.file.path, outputPath);
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([req.file!.path, outputPath]);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

// Merge PDFs
router.post(
  '/merge',
  authenticate, // authenticate already allows guests
  upload.array('files', 10), // Allow up to 10 files
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length < 2) {
        return res.status(400).json({ message: 'Please upload at least 2 PDF files' });
      }

      const files = req.files as Express.Multer.File[];

      // Validate all files are PDFs
      const invalidFiles = files.filter(
        (file) => file.mimetype !== 'application/pdf'
      );
      if (invalidFiles.length > 0) {
        cleanupFiles(files.map((f) => f.path));
        return res.status(400).json({ message: 'All files must be PDFs' });
      }

      const outputDir = path.join(process.cwd(), 'uploads', 'merge_' + Date.now());
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, 'merged.pdf');

      const pdfPaths = files.map((file) => file.path);
      await PDFService.mergePdfs(pdfPaths, outputPath);

      res.download(outputPath, 'merged.pdf', async (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([...pdfPaths, outputPath]);
        try {
          await fs.rm(outputDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      });
    } catch (error: any) {
      console.error('Merge PDF error:', error);
      if (req.files) {
        cleanupFiles((req.files as Express.Multer.File[]).map((f) => f.path));
      }
      res.status(500).json({ message: error.message || 'Failed to merge PDFs' });
    }
  }
);

// Compress PDF
router.post(
  '/compress',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const outputPath = req.file.path.replace('.pdf', '_compressed.pdf');
      await PDFService.compressPdf(req.file.path, outputPath);
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup
        cleanupFiles([req.file!.path, outputPath]);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

