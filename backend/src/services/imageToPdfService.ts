import fs from 'fs/promises';
import sharp from 'sharp';
import { PDFDocument } from '@cantoo/pdf-lib';
import { AppError, toAppError } from '../lib/errors';

/**
 * Images to PDF.
 *
 * Now accepts multiple images and produces one page per image, with a choice of
 * page size and orientation. The previous version handled a single image only.
 */

export type PageSize = 'auto' | 'a4' | 'letter';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface ImageToPdfOptions {
  pageSize?: PageSize;
  orientation?: Orientation;
  /** Margin in points applied when a fixed page size is used. */
  margin?: number;
}

export interface ImageToPdfResult {
  outputPath: string;
  pageCount: number;
}

const PAGE_DIMENSIONS: Record<'a4' | 'letter', { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/** Beyond this, memory use during re-encoding becomes a risk. */
const MAX_DIMENSION = 4000;

export class ImageToPdfService {
  static async convert(
    imagePaths: string[],
    outputPath: string,
    options: ImageToPdfOptions = {}
  ): Promise<ImageToPdfResult> {
    if (!imagePaths.length) {
      throw new AppError('INVALID_INPUT', 'Select at least one image.');
    }

    const { pageSize = 'auto', orientation = 'auto', margin = 28 } = options;

    try {
      const pdf = await PDFDocument.create();

      for (const imagePath of imagePaths) {
        const prepared = await this.prepare(imagePath);

        const embedded =
          prepared.format === 'png'
            ? await pdf.embedPng(prepared.buffer)
            : await pdf.embedJpg(prepared.buffer);

        if (pageSize === 'auto') {
          const page = pdf.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, {
            x: 0,
            y: 0,
            width: embedded.width,
            height: embedded.height,
          });
          continue;
        }

        const base = PAGE_DIMENSIONS[pageSize];
        const landscape =
          orientation === 'landscape' ||
          (orientation === 'auto' && embedded.width > embedded.height);

        const pageWidth = landscape ? base.height : base.width;
        const pageHeight = landscape ? base.width : base.height;

        const page = pdf.addPage([pageWidth, pageHeight]);

        const available = {
          width: pageWidth - margin * 2,
          height: pageHeight - margin * 2,
        };
        const scale = Math.min(
          available.width / embedded.width,
          available.height / embedded.height
        );
        const width = embedded.width * scale;
        const height = embedded.height * scale;

        page.drawImage(embedded, {
          x: (pageWidth - width) / 2,
          y: (pageHeight - height) / 2,
          width,
          height,
        });
      }

      await fs.writeFile(outputPath, await pdf.save());
      return { outputPath, pageCount: pdf.getPageCount() };
    } catch (error) {
      throw toAppError(error, 'The images could not be converted to PDF.');
    }
  }

  /**
   * Normalises any supported image into PNG or JPEG, which are the only formats
   * pdf-lib can embed. `rotate()` applies EXIF orientation so photos from
   * phones are not sideways.
   */
  private static async prepare(
    imagePath: string
  ): Promise<{ buffer: Buffer; format: 'png' | 'jpeg' }> {
    let pipeline = sharp(imagePath, { failOn: 'none' }).rotate();

    const metadata = await pipeline.metadata();
    if (!metadata.width || !metadata.height) {
      throw new AppError(
        'UNSUPPORTED_FILE',
        'This image could not be read.',
        'Supported formats are JPG, PNG, WebP, GIF, TIFF, AVIF and HEIC.'
      );
    }

    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Transparency only survives in PNG, so keep those lossless and send
    // everything else through JPEG for a much smaller file.
    if (metadata.hasAlpha) {
      return { buffer: await pipeline.png({ compressionLevel: 9 }).toBuffer(), format: 'png' };
    }

    return {
      buffer: await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer(),
      format: 'jpeg',
    };
  }
}
