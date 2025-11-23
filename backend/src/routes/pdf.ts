import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import pdfParse from 'pdf-parse';
import archiver from 'archiver';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PdfToWordService } from '../services/pdfToWordService';
import { ImageToPdfService } from '../services/imageToPdfService';
import { SplitPdfService } from '../services/splitPdfService';
import { PdfToTxtService } from '../services/pdfToTxtService';
import { PdfToEpubService } from '../services/pdfToEpubService';
import { MergePdfService } from '../services/mergePdfService';
import { CompressPdfService } from '../services/compressPdfService';
import { WatermarkPdfService } from '../services/watermarkPdfService';
import { WordToPdfService } from '../services/wordToPdfService';
import { ProtectPdfService } from '../services/protectPdfService';
import { OCRService } from '../services/ocrService';
import { saveFileHistory } from '../utils/fileHistory';

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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  },
});

// Helper function to clean up files
const cleanupFiles = async (filePaths: string[], keepForAuth: boolean = false, userId?: string) => {
  // For authenticated users, keep files for history
  if (keepForAuth && userId) {
    return;
  }
  
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
      await PdfToWordService.convert(req.file.path, outputPath);
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'word',
        fileSize,
      });
      
      res.download(outputPath, 'extracted_text.txt', (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
      });
    } catch (error: any) {
      // If it's a text extraction (our custom message), still send the file
      if (error.message.includes('PDF to Word:')) {
        const txtPath = req.file.path.replace('.pdf', '.txt');
        try {
          const dataBuffer = await fs.readFile(req.file.path);
          const pdfData = await pdfParse(dataBuffer);
          await fs.writeFile(txtPath, pdfData.text || 'No text found');
          
          // Get file size
          const stats = await fs.stat(txtPath);
          const fileSize = stats.size;
          
          // Save file history for authenticated users
          await saveFileHistory({
            userId: req.userId,
            isGuest: req.isGuest,
            originalFileName: req.file.originalname,
            processedFilePath: txtPath,
            operation: 'word',
            fileSize,
          });
          
          res.download(txtPath, 'extracted_text.txt', (err) => {
            if (err) {
              console.error('Download error:', err);
            }
            // Cleanup only for guest users
            cleanupFiles([req.file!.path, txtPath], !!req.userId && !req.isGuest, req.userId);
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

// Word to PDF
router.post(
  '/word-to-pdf',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file is Word document
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const wordMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    
    // Check both MIME type and file extension
    const isValidMimeType = wordMimeTypes.includes(req.file.mimetype);
    const isValidExtension = fileExtension === '.doc' || fileExtension === '.docx';
    
    if (!isValidMimeType && !isValidExtension) {
      cleanupFiles([req.file.path]);
      return res.status(400).json({ message: 'File must be a Word document (.docx format is recommended)' });
    }
    
    // Warn about .doc files (legacy format)
    if (fileExtension === '.doc' || req.file.mimetype === 'application/msword') {
      console.warn('Legacy .doc file detected. Mammoth only supports .docx format.');
    }

    try {
      console.log('Word to PDF request:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });
      
      const outputPath = req.file.path.replace(path.extname(req.file.path), '.pdf');
      await WordToPdfService.convert(req.file.path, outputPath, req.file.originalname);
      
      // Verify output file was created
      try {
        await fs.access(outputPath);
      } catch {
        throw new Error('PDF file was not created successfully');
      }
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      console.log('Word to PDF conversion successful:', {
        outputPath,
        fileSize,
      });
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'word-to-pdf',
        fileSize,
      });
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
      });
    } catch (error: any) {
      console.error('Word to PDF error:', {
        message: error.message,
        stack: error.stack,
        filename: req.file?.originalname,
      });
      cleanupFiles([req.file.path]);
      res.status(500).json({ 
        message: error.message || 'Failed to convert Word document to PDF. Please ensure the file is a valid .docx document.' 
      });
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
      await ImageToPdfService.convert(req.file.path, outputPath);
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'pdf',
        fileSize,
      });
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
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
      const outputFiles = await SplitPdfService.split(req.file.path, outputDir, parsedRanges);

      if (outputFiles.length === 0) {
        cleanupFiles([req.file.path]);
        res.status(500).json({ message: 'Failed to split PDF' });
        return;
      }

      // Always send the single combined PDF file
      // (When pageRanges are specified, all pages are combined into one file)
      if (outputFiles.length > 0) {
        const outputFile = outputFiles[0];
        const fileName = parsedRanges ? 'split_pages.pdf' : path.basename(outputFile);
        
        // Get file size
        const stats = await fs.stat(outputFile);
        const fileSize = stats.size;
        
        // Save file history for authenticated users
        await saveFileHistory({
          userId: req.userId,
          isGuest: req.isGuest,
          originalFileName: req.file.originalname,
          processedFilePath: outputFile,
          operation: 'split',
          fileSize,
        });
        
        res.download(outputFile, fileName, async (err) => {
          if (err) {
            console.error('Download error:', err);
          }
          // Cleanup only for guest users
          if (req.isGuest || !req.userId) {
            cleanupFiles([req.file!.path, ...outputFiles]);
            try {
              await fs.rm(outputDir, { recursive: true, force: true });
            } catch {}
          }
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
      await PdfToTxtService.convert(req.file.path, outputPath);
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'txt',
        fileSize,
      });
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
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
      await PdfToEpubService.convert(req.file.path, outputPath);
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'epub',
        fileSize,
      });
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
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
      const createSearchablePdf = req.body.createSearchablePdf === 'true' || req.body.createSearchablePdf === true;

      // If user wants searchable PDF, use OCR.space API to create it
      if (createSearchablePdf) {
        console.log('Creating searchable PDF...');
        const file = req.file; // Store in variable for TypeScript type narrowing
        const result = await OCRService.createSearchablePdf(file.path);
        
        // Download the searchable PDF from OCR.space URL
        return new Promise<void>((resolve) => {
          const parsedUrl = new URL(result.searchablePdfUrl);
          const client = parsedUrl.protocol === 'https:' ? https : http;
          
          const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
          };
          
          client.get(options, (response: any) => {
            if (response.statusCode !== 200) {
              cleanupFiles([file.path]);
              res.status(500).json({ message: 'Failed to download searchable PDF from OCR.space' });
              return resolve();
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk: Buffer) => chunks.push(chunk));
            response.on('end', async () => {
              try {
                 const pdfBuffer = Buffer.concat(chunks);
                 const outputPath = file.path.replace('.pdf', '_searchable.pdf');
                 await fs.writeFile(outputPath, pdfBuffer);
                 
                 const stats = await fs.stat(outputPath);
                 const fileSize = stats.size;
                 
                 // Save file history for authenticated users
                 const savedFile = await saveFileHistory({
                   userId: req.userId,
                   isGuest: req.isGuest,
                   originalFileName: file.originalname,
                   processedFilePath: outputPath,
                   operation: 'ocr',
                   fileSize,
                 });
                 
                 // Return file ID for download from our backend (avoids CORS)
                 res.json({
                   type: 'searchablePdf',
                   fileId: savedFile?._id?.toString() || null,
                   fileName: file.originalname.replace('.pdf', '_searchable.pdf'),
                   fileSize: fileSize,
                   text: result.text,
                   characterCount: result.text.length,
                   wordCount: result.text.split(/\s+/).filter(w => w.length > 0).length,
                 });
                 
                 // Cleanup only for guest users (keep files for logged-in users)
                 cleanupFiles([file.path, outputPath], !!req.userId && !req.isGuest, req.userId);
                resolve();
              } catch (error: any) {
                cleanupFiles([file.path]);
                res.status(500).json({ message: error.message || 'Failed to save searchable PDF' });
                resolve();
              }
            });
          }).on('error', (error: any) => {
            cleanupFiles([file.path]);
            res.status(500).json({ message: `Failed to download searchable PDF: ${error.message}` });
            resolve();
          });
        });
      } else {
        // Extract text only
        const extractedText = await OCRService.extractTextFromPdf(req.file.path);
        
        if (!extractedText || extractedText.trim().length === 0) {
          cleanupFiles([req.file.path]);
          return res.status(400).json({ 
            message: 'No text could be extracted from this PDF. The PDF might be corrupted, password-protected, or contain only images without readable text.' 
          });
        }
        
        // Save text to file for download
        const outputPath = req.file.path.replace('.pdf', '_ocr.txt');
        await fs.writeFile(outputPath, extractedText, 'utf-8');
        
        // Get file size
        const stats = await fs.stat(outputPath);
        const fileSize = stats.size;
        
        // Save file history for authenticated users
        await saveFileHistory({
          userId: req.userId,
          isGuest: req.isGuest,
          originalFileName: req.file.originalname,
          processedFilePath: outputPath,
          operation: 'ocr',
          fileSize,
        });
        
        // Return text content and file info instead of downloading
        res.json({
          type: 'text',
          text: extractedText,
          fileName: req.file.originalname.replace('.pdf', '_ocr.txt'),
          fileSize: fileSize,
          characterCount: extractedText.length,
          wordCount: extractedText.split(/\s+/).filter(w => w.length > 0).length,
        });
        
        // Cleanup only for guest users (keep files for logged-in users)
        cleanupFiles([req.file.path, outputPath], !!req.userId && !req.isGuest, req.userId);
      }
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      console.error('OCR error:', error);
      res.status(500).json({ message: error.message || 'Failed to extract text from PDF' });
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
      await MergePdfService.merge(pdfPaths, outputPath);

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: `merged_${files.length}_files.pdf`,
        processedFilePath: outputPath,
        operation: 'merge',
        fileSize,
      });

      res.download(outputPath, 'merged.pdf', async (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        if (req.isGuest || !req.userId) {
          cleanupFiles([...pdfPaths, outputPath]);
          try {
            await fs.rm(outputDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
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
      await CompressPdfService.compress(req.file.path, outputPath);
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'compress',
        fileSize,
      });
      
      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

// Watermark PDF
router.post(
  '/watermark',
  authenticate,
  (req, res, next) => {
    // Log incoming request for debugging
    console.log('Watermark route - Request received:', {
      method: req.method,
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
    next();
  },
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ message: err.message || 'File upload error' });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    // Log after multer processing
    console.log('After multer - Request body:', req.body);
    console.log('After multer - File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    } : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const { watermarkText, position, opacity, fontSize, rotation } = req.body;
      
      console.log('Extracted form fields:', {
        watermarkText,
        position,
        opacity,
        fontSize,
        rotation,
      });
      
      if (!watermarkText || !watermarkText.trim()) {
        cleanupFiles([req.file.path]);
        return res.status(400).json({ message: 'Watermark text is required' });
      }

      // Validate file is PDF
      if (req.file.mimetype !== 'application/pdf') {
        cleanupFiles([req.file.path]);
        return res.status(400).json({ message: 'File must be a PDF' });
      }

      // Ensure output path has .pdf extension
      const outputPath = req.file.path.endsWith('.pdf') 
        ? req.file.path.replace('.pdf', '_watermarked.pdf')
        : req.file.path + '_watermarked.pdf';
      
      console.log('Starting watermark process:', {
        inputPath: req.file.path,
        outputPath,
        watermarkText,
        position,
        opacity,
        fontSize,
      });
      
      await WatermarkPdfService.addWatermark(req.file.path, outputPath, watermarkText.trim(), {
        position: position || 'center',
        opacity: opacity ? parseFloat(opacity) : 0.3,
        fontSize: fontSize ? parseInt(fontSize) : 50,
        rotation: rotation ? parseFloat(rotation) : -45,
      });

      // Verify output file was created
      try {
        await fs.access(outputPath);
      } catch {
        throw new Error('Watermarked PDF was not created');
      }

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;

      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'watermark',
        fileSize,
      });

      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
      });
    } catch (error: any) {
      console.error('Watermark route error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Clean up input file
      try {
        cleanupFiles([req.file.path]);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      
      // Ensure we send JSON response, not blob
      const errorMessage = error.message || 'Failed to add watermark to PDF';
      console.error('Sending error response:', errorMessage);
      res.status(500).json({ message: errorMessage });
    }
  }
);

// Protect PDF with password
router.post(
  '/protect',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const { password, ownerPassword, allowPrinting, allowModifying, allowCopying, allowAnnotating } = req.body;
      
      if (!password) {
        cleanupFiles([req.file.path]);
        return res.status(400).json({ message: 'Password is required' });
      }

      // Ensure output path has .pdf extension
      const outputPath = req.file.path.endsWith('.pdf')
        ? req.file.path.replace('.pdf', '_protected.pdf')
        : req.file.path + '_protected.pdf';
      
      await ProtectPdfService.protect(req.file.path, outputPath, password, ownerPassword, {
        printing: allowPrinting === 'false' ? false : allowPrinting === 'low' ? 'lowResolution' : 'highResolution',
        modifying: allowModifying !== 'false',
        copying: allowCopying !== 'false',
        annotating: allowAnnotating !== 'false',
      });

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;

      // Save file history for authenticated users
      await saveFileHistory({
        userId: req.userId,
        isGuest: req.isGuest,
        originalFileName: req.file.originalname,
        processedFilePath: outputPath,
        operation: 'protect',
        fileSize,
      });

      res.download(outputPath, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Cleanup only for guest users
        cleanupFiles([req.file!.path, outputPath], !!req.userId && !req.isGuest, req.userId);
      });
    } catch (error: any) {
      cleanupFiles([req.file.path]);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

