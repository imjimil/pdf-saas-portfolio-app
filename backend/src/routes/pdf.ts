import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploader, normalizeUploadError } from '../middleware/upload';
import { Workspace } from '../lib/workspace';
import { getCapabilities } from '../lib/binaries';
import { AppError } from '../lib/errors';
import { sendFile, sendError, withExtension, fileSize } from '../lib/respond';
import { recordActivity } from '../utils/fileHistory';
import type { Operation } from '../lib/operations';

import { PdfToWordService } from '../services/pdfToWordService';
import { WordToPdfService } from '../services/wordToPdfService';
import { ImageToPdfService } from '../services/imageToPdfService';
import { PdfToTxtService } from '../services/pdfToTxtService';
import { PdfToEpubService } from '../services/pdfToEpubService';
import { SplitPdfService } from '../services/splitPdfService';
import { MergePdfService } from '../services/mergePdfService';
import { CompressPdfService } from '../services/compressPdfService';
import type { CompressionLevel } from '../services/engines/ghostscript';
import { WatermarkPdfService } from '../services/watermarkPdfService';
import { ProtectPdfService } from '../services/protectPdfService';
import { OCRService } from '../services/ocrService';

const router = express.Router();

// --- Plumbing ---------------------------------------------------------------

/** Wraps multer so upload failures return a typed error, not an HTML stack. */
function receive(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, (error: unknown) => {
      if (error) {
        const appError = normalizeUploadError(error);
        res.status(appError.statusCode).json(appError.toJSON());
        return;
      }
      next();
    });
  };
}

const singlePdf = receive(uploader(['pdf']).single('file'));
const singleWord = receive(uploader(['word']).single('file'));
const manyImages = receive(uploader(['image'], 30).array('files', 30));
const manyPdfs = receive(uploader(['pdf'], 20).array('files', 20));

type ToolContext = {
  req: AuthRequest;
  res: Response;
  workspace: Workspace;
  files: Express.Multer.File[];
};

/**
 * Every tool route runs through here so that temp files are always removed,
 * uploads are always validated, and errors always come back as typed JSON.
 */
function tool(
  name: string,
  run: (context: ToolContext) => Promise<void>
): RequestHandler {
  return async (req, res) => {
    const authReq = req as AuthRequest;
    const uploaded = collectFiles(authReq);
    const workspace = await Workspace.create(name);

    try {
      if (!uploaded.length) {
        throw new AppError('INVALID_INPUT', 'No file was uploaded.');
      }
      await run({ req: authReq, res, workspace, files: uploaded });
    } catch (error) {
      sendError(res, error, name);
    } finally {
      await workspace.dispose();
      await Promise.all(
        uploaded.map((file) => fs.unlink(file.path).catch(() => undefined))
      );
    }
  };
}

function collectFiles(req: Request): Express.Multer.File[] {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  return [];
}

/** Streams the result, then records the job against the user's history. */
async function deliver(
  context: ToolContext,
  operation: Operation,
  resultPath: string,
  downloadName: string,
  meta: Record<string, string | number | boolean> = {}
): Promise<void> {
  const size = await fileSize(resultPath);

  await sendFile(context.res, resultPath, downloadName, { ...meta, size });

  await recordActivity({
    userId: context.req.userId,
    isGuest: context.req.isGuest,
    originalFileName: context.files[0]?.originalname ?? 'document',
    resultFileName: downloadName,
    operation,
    fileSize: size,
  });
}

const bool = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return value === true || value === 'true' || value === '1';
};

// --- Capability probe --------------------------------------------------------

router.get('/capabilities', async (_req: Request, res: Response) => {
  const caps = await getCapabilities();
  res.json({
    wordToPdf: caps.libreoffice ? 'high' : 'basic',
    pdfToWord: caps.pdf2docx ? 'high' : caps.libreoffice ? 'good' : 'basic',
    compress: caps.ghostscript ? 'high' : 'basic',
    protect: caps.qpdf,
    ocr: caps.tesseract || Boolean(process.env.OCR_SPACE_API_KEY),
    searchablePdf: caps.tesseract,
  });
});

// --- Conversions -------------------------------------------------------------

router.post(
  '/to-word',
  authenticate,
  singlePdf,
  tool('pdf-to-word', async (context) => {
    const [file] = context.files;
    const output = context.workspace.file('converted.docx');

    const result = await PdfToWordService.convert(file.path, output);

    await deliver(
      context,
      'pdf-to-word',
      result.outputPath,
      withExtension(file.originalname, '.docx'),
      { fidelity: result.fidelity, engine: result.engine }
    );
  })
);

router.post(
  '/word-to-pdf',
  authenticate,
  singleWord,
  tool('word-to-pdf', async (context) => {
    const [file] = context.files;
    const output = context.workspace.file('converted.pdf');

    const result = await WordToPdfService.convert(
      file.path,
      output,
      file.originalname
    );

    await deliver(
      context,
      'word-to-pdf',
      result.outputPath,
      withExtension(file.originalname, '.pdf'),
      { fidelity: result.fidelity }
    );
  })
);

router.post(
  '/image-to-pdf',
  authenticate,
  manyImages,
  tool('image-to-pdf', async (context) => {
    const output = context.workspace.file('images.pdf');

    const result = await ImageToPdfService.convert(
      context.files.map((file) => file.path),
      output,
      {
        pageSize: (context.req.body.pageSize as 'auto' | 'a4' | 'letter') ?? 'auto',
        orientation:
          (context.req.body.orientation as 'auto' | 'portrait' | 'landscape') ?? 'auto',
      }
    );

    const name =
      context.files.length === 1
        ? withExtension(context.files[0].originalname, '.pdf')
        : `images_${context.files.length}.pdf`;

    await deliver(context, 'image-to-pdf', result.outputPath, name, {
      pages: result.pageCount,
    });
  })
);

router.post(
  '/to-txt',
  authenticate,
  singlePdf,
  tool('pdf-to-text', async (context) => {
    const [file] = context.files;
    const output = context.workspace.file('extracted.txt');

    const result = await PdfToTxtService.convert(file.path, output, {
      layout: bool(context.req.body.layout, true),
      includePageMarkers: bool(context.req.body.pageMarkers, false),
    });

    await deliver(
      context,
      'pdf-to-text',
      result.outputPath,
      withExtension(file.originalname, '.txt'),
      { words: result.wordCount, characters: result.characterCount }
    );
  })
);

router.post(
  '/to-epub',
  authenticate,
  singlePdf,
  tool('pdf-to-epub', async (context) => {
    const [file] = context.files;
    const output = context.workspace.file('book.epub');

    const result = await PdfToEpubService.convert(
      file.path,
      output,
      context.workspace.dir,
      {
        title: context.req.body.title,
        author: context.req.body.author,
      }
    );

    await deliver(
      context,
      'pdf-to-epub',
      result.outputPath,
      withExtension(file.originalname, '.epub'),
      { chapters: result.chapterCount }
    );
  })
);

// --- Page operations ---------------------------------------------------------

router.post(
  '/split',
  authenticate,
  singlePdf,
  tool('split', async (context) => {
    const [file] = context.files;
    const { mode, pageRanges, chunkSize } = context.req.body;

    const result = await SplitPdfService.split(
      file.path,
      await context.workspace.subdir('out'),
      file.originalname,
      {
        mode: (mode as 'ranges' | 'all' | 'every-n') || (pageRanges ? 'ranges' : 'all'),
        pageRanges,
        chunkSize: chunkSize ? Number(chunkSize) : undefined,
      }
    );

    await deliver(context, 'split', result.outputPath, result.fileName, {
      documents: result.documentCount,
      pages: result.pageCount,
      archive: result.isArchive,
    });
  })
);

router.post(
  '/merge',
  authenticate,
  manyPdfs,
  tool('merge', async (context) => {
    if (context.files.length < 2) {
      throw new AppError('INVALID_INPUT', 'Select at least two PDFs to merge.');
    }

    const output = context.workspace.file('merged.pdf');
    const result = await MergePdfService.merge(
      context.files.map((file) => ({
        path: file.path,
        originalName: file.originalname,
      })),
      output
    );

    await deliver(context, 'merge', result.outputPath, 'merged.pdf', {
      pages: result.pageCount,
      documents: result.documentCount,
    });
  })
);

router.post(
  '/compress',
  authenticate,
  singlePdf,
  tool('compress', async (context) => {
    const [file] = context.files;
    const output = context.workspace.file('compressed.pdf');

    const result = await CompressPdfService.compress(
      file.path,
      output,
      (context.req.body.level as CompressionLevel) || 'balanced'
    );

    await deliver(
      context,
      'compress',
      result.outputPath,
      withExtension(file.originalname, '.pdf'),
      {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savedPercent: result.savedPercent,
        alreadyOptimized: result.alreadyOptimized,
      }
    );
  })
);

// --- Security and marking ----------------------------------------------------

router.post(
  '/watermark',
  authenticate,
  singlePdf,
  tool('watermark', async (context) => {
    const [file] = context.files;
    const { watermarkText, position, opacity, fontSize, rotation } = context.req.body;

    const output = context.workspace.file('watermarked.pdf');

    const result = await WatermarkPdfService.addWatermark(
      file.path,
      output,
      watermarkText,
      {
        position: position || 'center',
        opacity: opacity !== undefined ? Number(opacity) : 0.25,
        fontSize: fontSize ? Number(fontSize) : undefined,
        rotation: rotation !== undefined ? Number(rotation) : -45,
      }
    );

    await deliver(
      context,
      'watermark',
      result.outputPath,
      withExtension(file.originalname, '.pdf'),
      { pages: result.pagesMarked }
    );
  })
);

router.post(
  '/protect',
  authenticate,
  singlePdf,
  tool('protect', async (context) => {
    const [file] = context.files;
    const body = context.req.body;
    const output = context.workspace.file('protected.pdf');

    const result = await ProtectPdfService.protect(
      file.path,
      output,
      body.password,
      {
        ownerPassword: body.ownerPassword,
        allowPrinting:
          body.allowPrinting === 'low' ? 'low' : bool(body.allowPrinting, true),
        allowModifying: bool(body.allowModifying, false),
        allowCopying: bool(body.allowCopying, false),
        allowAnnotating: bool(body.allowAnnotating, false),
      }
    );

    await deliver(
      context,
      'protect',
      result.outputPath,
      withExtension(file.originalname, '.pdf'),
      { encryption: result.encryption }
    );
  })
);

router.post(
  '/unlock',
  authenticate,
  singlePdf,
  tool('unlock', async (context) => {
    const [file] = context.files;
    const output = context.workspace.file('unlocked.pdf');

    const result = await ProtectPdfService.unlock(
      file.path,
      output,
      context.req.body.password
    );

    await deliver(
      context,
      'unlock',
      result.outputPath,
      withExtension(file.originalname, '.pdf')
    );
  })
);

// --- OCR ---------------------------------------------------------------------

router.post(
  '/ocr',
  authenticate,
  singlePdf,
  tool('ocr', async (context) => {
    const [file] = context.files;
    const wantsSearchablePdf = bool(context.req.body.createSearchablePdf, false);
    const language = (context.req.body.language as string) || 'eng';

    if (wantsSearchablePdf) {
      const output = context.workspace.file('searchable.pdf');
      const result = await OCRService.createSearchablePdf(
        file.path,
        output,
        context.workspace.dir,
        { language }
      );

      await deliver(
        context,
        'ocr',
        result.outputPath,
        withExtension(file.originalname, '_searchable.pdf'),
        { words: result.text.split(/\s+/).filter(Boolean).length }
      );
      return;
    }

    const result = await OCRService.extractText(file.path, context.workspace.dir, {
      language,
    });

    // Text results are JSON so the UI can preview them before downloading.
    context.res.json({
      type: 'text',
      text: result.text,
      fileName: withExtension(file.originalname, '.txt'),
      characterCount: result.characterCount,
      wordCount: result.wordCount,
      source: result.source,
    });

    await recordActivity({
      userId: context.req.userId,
      isGuest: context.req.isGuest,
      originalFileName: file.originalname,
      resultFileName: withExtension(file.originalname, '.txt'),
      operation: 'ocr',
      fileSize: Buffer.byteLength(result.text, 'utf-8'),
    });
  })
);

// Guards against a stray upload error escaping as an HTML error page.
router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (!error) return next();
  const appError = normalizeUploadError(error);
  if (!res.headersSent) {
    res.status(appError.statusCode).json(appError.toJSON());
  }
});

export default router;
