import fs from 'fs/promises';
import { StandardFonts, rgb, degrees, PDFPage, PDFFont } from '@cantoo/pdf-lib';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';

/**
 * Text watermarking.
 *
 * Rotation is now actually applied — the previous version accepted a rotation
 * option and silently ignored it, so every diagonal watermark came out flat.
 */

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'tile';

export interface WatermarkOptions {
  position?: WatermarkPosition;
  opacity?: number;
  fontSize?: number;
  rotation?: number;
  color?: { r: number; g: number; b: number };
  /** Apply only to these 1-based pages; all pages when omitted. */
  pages?: number[];
}

export interface WatermarkResult {
  outputPath: string;
  pagesMarked: number;
}

export class WatermarkPdfService {
  static async addWatermark(
    inputPath: string,
    outputPath: string,
    text: string,
    options: WatermarkOptions = {}
  ): Promise<WatermarkResult> {
    const watermark = text?.trim();
    if (!watermark) {
      throw new AppError('INVALID_INPUT', 'Enter the watermark text.');
    }
    if (watermark.length > 120) {
      throw new AppError('INVALID_INPUT', 'Watermark text is limited to 120 characters.');
    }

    try {
      const pdf = await loadPdf(inputPath, { ignoreEncryption: false });
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);

      const position = options.position ?? 'center';
      const opacity = clamp(options.opacity ?? 0.25, 0.02, 1);
      const rotation = options.rotation ?? -45;
      const color = options.color ?? { r: 0.45, g: 0.45, b: 0.5 };

      // pdf-lib's standard fonts are WinAnsi-encoded and throw on other glyphs.
      const safeText = watermark.replace(/[^\x20-\xFF]/g, '');
      if (!safeText.trim()) {
        throw new AppError(
          'INVALID_INPUT',
          'The watermark text uses characters that are not supported.',
          'Try using Latin letters, numbers and basic punctuation.'
        );
      }

      const pages = pdf.getPages();
      const selected = options.pages?.length
        ? options.pages.filter((page) => page >= 1 && page <= pages.length)
        : pages.map((_, index) => index + 1);

      for (const pageNumber of selected) {
        const page = pages[pageNumber - 1];
        const { width, height } = page.getSize();

        // Scale to the page so the watermark reads the same on A4 and A3.
        const fontSize =
          options.fontSize ?? Math.max(18, Math.min(width, height) * 0.09);

        if (position === 'tile') {
          this.drawTiled(page, safeText, font, fontSize, opacity, color, rotation);
          continue;
        }

        const textWidth = font.widthOfTextAtSize(safeText, fontSize);
        const { x, y } = anchor(position, width, height, textWidth, fontSize);

        page.drawText(safeText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: degrees(rotation),
        });
      }

      await fs.writeFile(outputPath, await pdf.save());
      return { outputPath, pagesMarked: selected.length };
    } catch (error) {
      throw toAppError(error, 'The watermark could not be applied.');
    }
  }

  private static drawTiled(
    page: PDFPage,
    text: string,
    font: PDFFont,
    fontSize: number,
    opacity: number,
    color: { r: number; g: number; b: number },
    rotation: number
  ): void {
    const { width, height } = page.getSize();
    const tileSize = fontSize * 0.6;
    const textWidth = font.widthOfTextAtSize(text, tileSize);
    const stepX = textWidth + 70;
    const stepY = tileSize * 5;

    for (let y = -stepY; y < height + stepY; y += stepY) {
      for (let x = -stepX; x < width + stepX; x += stepX) {
        page.drawText(text, {
          x,
          y,
          size: tileSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity: opacity * 0.75,
          rotate: degrees(rotation),
        });
      }
    }
  }
}

function anchor(
  position: Exclude<WatermarkPosition, 'tile'>,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  fontSize: number
): { x: number; y: number } {
  const margin = 40;

  switch (position) {
    case 'top-left':
      return { x: margin, y: pageHeight - margin - fontSize };
    case 'top-right':
      return { x: pageWidth - textWidth - margin, y: pageHeight - margin - fontSize };
    case 'bottom-left':
      return { x: margin, y: margin };
    case 'bottom-right':
      return { x: pageWidth - textWidth - margin, y: margin };
    case 'center':
    default:
      return { x: (pageWidth - textWidth) / 2, y: pageHeight / 2 - fontSize / 2 };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
