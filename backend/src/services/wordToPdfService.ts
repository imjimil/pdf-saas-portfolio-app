import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb, PDFFont } from '@cantoo/pdf-lib';
import { AppError, toAppError } from '../lib/errors';
import * as libreoffice from './engines/libreoffice';

/**
 * Word to PDF.
 *
 * Primary path is LibreOffice, which renders the document with its original
 * fonts, images, tables and page layout. The JavaScript fallback exists so
 * local development works without LibreOffice installed; it preserves reading
 * order and basic styling but not exact layout.
 */

export interface WordToPdfResult {
  outputPath: string;
  fidelity: 'exact' | 'approximate';
}

export class WordToPdfService {
  static async convert(
    inputPath: string,
    outputPath: string,
    originalName: string
  ): Promise<WordToPdfResult> {
    await this.validateInput(inputPath, originalName);

    if (await libreoffice.isAvailable()) {
      const outDir = path.dirname(outputPath);
      const produced = await libreoffice.toPdf(inputPath, outDir);

      if (path.resolve(produced) !== path.resolve(outputPath)) {
        await fs.rename(produced, outputPath);
      }

      await this.assertNonEmpty(outputPath);
      return { outputPath, fidelity: 'exact' };
    }

    await this.convertWithFallback(inputPath, outputPath);
    return { outputPath, fidelity: 'approximate' };
  }

  private static async validateInput(
    inputPath: string,
    originalName: string
  ): Promise<void> {
    const buffer = await fs.readFile(inputPath);

    if (buffer.length === 0) {
      throw new AppError('INVALID_INPUT', 'The uploaded document is empty.');
    }

    const extension = path.extname(originalName).toLowerCase();

    // .docx is a ZIP archive; legacy .doc is an OLE compound file.
    const isZip = buffer.subarray(0, 2).toString('latin1') === 'PK';
    const isLegacyDoc =
      buffer.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1';

    if (isLegacyDoc && !(await libreoffice.isAvailable())) {
      throw new AppError(
        'UNSUPPORTED_FILE',
        'Legacy .doc files are not supported in this environment.',
        'Open the file in Word and save it as .docx, then upload it again.'
      );
    }

    if (!isZip && !isLegacyDoc) {
      throw new AppError(
        'UNSUPPORTED_FILE',
        `"${extension || 'This file'}" is not a Word document.`,
        'Upload a .docx or .doc file.'
      );
    }
  }

  private static async assertNonEmpty(filePath: string): Promise<void> {
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || stat.size === 0) {
      throw new AppError(
        'PROCESSING_FAILED',
        'The converted PDF came out empty.'
      );
    }
  }

  /**
   * Renders DOCX to PDF without LibreOffice.
   *
   * Unlike the previous implementation, this walks the HTML in document order
   * so headings, paragraphs and lists keep their original sequence, and it
   * embeds inline images rather than discarding them.
   */
  private static async convertWithFallback(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    try {
      const buffer = await fs.readFile(inputPath);
      const { value: html } = await mammoth.convertToHtml(
        { buffer },
        { convertImage: mammoth.images.dataUri }
      );

      const blocks = parseHtmlInOrder(html);
      if (!blocks.length) {
        throw new AppError(
          'EMPTY_RESULT',
          'This document appears to contain no readable content.'
        );
      }

      const pdf = await PDFDocument.create();
      const fonts = {
        regular: await pdf.embedFont(StandardFonts.Helvetica),
        bold: await pdf.embedFont(StandardFonts.HelveticaBold),
        italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
      };

      const layout = { width: 595.28, height: 841.89, margin: 56 };
      const maxWidth = layout.width - layout.margin * 2;

      let page = pdf.addPage([layout.width, layout.height]);
      let cursorY = layout.height - layout.margin;

      const ensureSpace = (needed: number) => {
        if (cursorY - needed < layout.margin) {
          page = pdf.addPage([layout.width, layout.height]);
          cursorY = layout.height - layout.margin;
        }
      };

      for (const block of blocks) {
        if (block.type === 'image') {
          const embedded = await embedDataUriImage(pdf, block.dataUri);
          if (!embedded) continue;

          const scale = Math.min(1, maxWidth / embedded.width);
          const width = embedded.width * scale;
          const height = embedded.height * scale;

          ensureSpace(height + 12);
          page.drawImage(embedded.image, {
            x: layout.margin,
            y: cursorY - height,
            width,
            height,
          });
          cursorY -= height + 12;
          continue;
        }

        const style = BLOCK_STYLES[block.type];
        const font = style.bold ? fonts.bold : fonts.regular;
        const prefix = block.listMarker ? `${block.listMarker}  ` : '';
        const indent = block.listMarker ? 18 : 0;

        const lines = wrapText(
          prefix + block.text,
          font,
          style.size,
          maxWidth - indent
        );

        ensureSpace(style.spaceBefore);
        cursorY -= style.spaceBefore;

        for (const line of lines) {
          ensureSpace(style.size * 1.45);
          page.drawText(line, {
            x: layout.margin + indent,
            y: cursorY - style.size,
            size: style.size,
            font,
            color: rgb(0.1, 0.1, 0.12),
          });
          cursorY -= style.size * 1.45;
        }

        cursorY -= style.spaceAfter;
      }

      await fs.writeFile(outputPath, await pdf.save());
    } catch (error) {
      throw toAppError(error, 'The Word document could not be converted to PDF.');
    }
  }
}

// --- HTML walking -----------------------------------------------------------

type Block =
  | { type: 'h1' | 'h2' | 'h3' | 'p'; text: string; listMarker?: string }
  | { type: 'image'; dataUri: string };

const BLOCK_STYLES: Record<
  'h1' | 'h2' | 'h3' | 'p',
  { size: number; bold: boolean; spaceBefore: number; spaceAfter: number }
> = {
  h1: { size: 22, bold: true, spaceBefore: 16, spaceAfter: 8 },
  h2: { size: 17, bold: true, spaceBefore: 13, spaceAfter: 6 },
  h3: { size: 14, bold: true, spaceBefore: 10, spaceAfter: 5 },
  p: { size: 11, bold: false, spaceBefore: 0, spaceAfter: 8 },
};

/**
 * Scans the HTML linearly and emits blocks in source order.
 * The previous implementation collected every heading, then every list, then
 * every paragraph, which reordered the whole document.
 */
function parseHtmlInOrder(html: string): Block[] {
  const blocks: Block[] = [];
  const pattern =
    /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*src="([^"]+)"[^>]*>/gi;

  let match: RegExpExecArray | null;
  let orderedIndex = 1;
  let inOrderedList = false;

  const listContext = /<(ol|ul)\b[^>]*>/gi;
  const listStarts: Array<{ index: number; ordered: boolean }> = [];
  let listMatch: RegExpExecArray | null;
  while ((listMatch = listContext.exec(html)) !== null) {
    listStarts.push({
      index: listMatch.index,
      ordered: listMatch[1].toLowerCase() === 'ol',
    });
  }

  while ((match = pattern.exec(html)) !== null) {
    if (match[3]) {
      blocks.push({ type: 'image', dataUri: match[3] });
      continue;
    }

    const tag = match[1].toLowerCase();
    const text = decodeEntities(stripTags(match[2])).trim();
    if (!text) continue;

    if (tag === 'li') {
      const enclosing = [...listStarts]
        .reverse()
        .find((start) => start.index < match!.index);
      const ordered = enclosing?.ordered ?? false;

      if (ordered !== inOrderedList) {
        orderedIndex = 1;
        inOrderedList = ordered;
      }

      blocks.push({
        type: 'p',
        text,
        listMarker: ordered ? `${orderedIndex++}.` : '•',
      });
      continue;
    }

    if (tag === 'p') {
      blocks.push({ type: 'p', text });
      continue;
    }

    const level = Number(tag[1]);
    blocks.push({ type: level <= 1 ? 'h1' : level === 2 ? 'h2' : 'h3', text });
  }

  return blocks;
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ');
}

function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
  };

  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#39;/gi, (entity) => named[entity.toLowerCase()] ?? entity);
}

async function embedDataUriImage(
  pdf: PDFDocument,
  dataUri: string
): Promise<{ image: Awaited<ReturnType<PDFDocument['embedPng']>>; width: number; height: number } | null> {
  const match = dataUri.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;

  try {
    const bytes = Buffer.from(match[2], 'base64');
    const image =
      match[1].toLowerCase() === 'png'
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
    return { image, width: image.width, height: image.height };
  } catch {
    return null;
  }
}

/** Greedy word wrap that also breaks words longer than the line. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const sanitized = text.replace(/[^\x20-\x7E\u00A0-\u024F]/g, '');
  const lines: string[] = [];
  let current = '';

  const widthOf = (value: string): number => {
    try {
      return font.widthOfTextAtSize(value, size);
    } catch {
      return value.length * size * 0.5;
    }
  };

  for (const word of sanitized.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;

    if (widthOf(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (widthOf(word) <= maxWidth) {
      current = word;
      continue;
    }

    let fragment = '';
    for (const char of word) {
      if (widthOf(fragment + char) > maxWidth) {
        lines.push(fragment);
        fragment = char;
      } else {
        fragment += char;
      }
    }
    current = fragment;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}
