import fs from 'fs/promises';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { AppError, toAppError } from '../lib/errors';
import { extractText } from '../lib/pdfText';
import { run } from '../lib/exec';
import { getCapabilities } from '../lib/binaries';
import * as libreoffice from './engines/libreoffice';
import * as poppler from './engines/poppler';
import { loadPdf } from '../lib/pdf';

/**
 * PDF to Word.
 *
 * This previously wrote a plain .txt file and presented it as a Word document.
 * It now always produces a real .docx, using the best engine available:
 *
 *   1. pdf2docx     - reconstructs paragraphs, tables and images (best quality)
 *   2. LibreOffice  - PDF import, keeps visual placement via text frames
 *   3. JavaScript   - structured .docx built from layout-preserved text
 */

export type ConversionFidelity = 'high' | 'good' | 'basic';

export interface PdfToWordResult {
  outputPath: string;
  fidelity: ConversionFidelity;
  engine: 'pdf2docx' | 'libreoffice' | 'javascript';
}

export class PdfToWordService {
  static async convert(
    inputPath: string,
    outputPath: string
  ): Promise<PdfToWordResult> {
    // Surfaces encryption and corruption before an engine fails opaquely.
    await loadPdf(inputPath, { ignoreEncryption: false });

    const capabilities = await getCapabilities();

    if (capabilities.pdf2docx) {
      try {
        await this.convertWithPdf2Docx(inputPath, outputPath);
        return { outputPath, fidelity: 'high', engine: 'pdf2docx' };
      } catch (error) {
        console.warn(
          'pdf2docx conversion failed, falling back:',
          error instanceof Error ? error.message : error
        );
      }
    }

    if (capabilities.libreoffice) {
      try {
        const outDir = path.dirname(outputPath);
        const produced = await libreoffice.pdfToDocx(inputPath, outDir);
        if (path.resolve(produced) !== path.resolve(outputPath)) {
          await fs.rename(produced, outputPath);
        }
        return { outputPath, fidelity: 'good', engine: 'libreoffice' };
      } catch (error) {
        console.warn(
          'LibreOffice PDF import failed, falling back:',
          error instanceof Error ? error.message : error
        );
      }
    }

    await this.convertWithJavaScript(inputPath, outputPath);
    return { outputPath, fidelity: 'basic', engine: 'javascript' };
  }

  private static async convertWithPdf2Docx(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    await run(
      'python3',
      [
        '-c',
        [
          'import sys',
          'from pdf2docx import Converter',
          'converter = Converter(sys.argv[1])',
          'converter.convert(sys.argv[2], start=0)',
          'converter.close()',
        ].join('\n'),
        inputPath,
        outputPath,
      ],
      { timeoutMs: 300_000 }
    );

    const stat = await fs.stat(outputPath).catch(() => null);
    if (!stat || stat.size === 0) {
      throw new AppError('PROCESSING_FAILED', 'Conversion produced an empty file.');
    }
  }

  /**
   * Builds a genuine .docx from extracted text.
   *
   * Poppler's layout-preserving extraction is used when available so columns
   * and indentation survive; otherwise pdf-parse supplies the text. Headings
   * and list items are inferred so the result is editable and structured
   * rather than one undifferentiated block.
   */
  private static async convertWithJavaScript(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    try {
      const text = await this.extractText(inputPath);

      if (!text.trim()) {
        throw new AppError(
          'EMPTY_RESULT',
          'No selectable text was found in this PDF.',
          'This looks like a scanned document — use the PDF OCR tool instead.'
        );
      }

      const paragraphs = this.buildParagraphs(text);

      const document = new Document({
        creator: 'Mypdftools',
        description: 'Converted from PDF',
        title: path.basename(outputPath, '.docx'),
        styles: {
          default: {
            document: {
              run: { font: 'Calibri', size: 22 },
              paragraph: { spacing: { after: 120, line: 276 } },
            },
          },
        },
        sections: [
          {
            properties: {
              page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
            },
            children: paragraphs,
          },
        ],
      });

      await fs.writeFile(outputPath, await Packer.toBuffer(document));
    } catch (error) {
      throw toAppError(error, 'The PDF could not be converted to Word.');
    }
  }

  private static async extractText(inputPath: string): Promise<string> {
    if (await poppler.isAvailable()) {
      try {
        return await poppler.toText(inputPath, { layout: true });
      } catch {
        // Fall through to pdf-parse.
      }
    }

    return (await extractText(inputPath)).text;
  }

  /**
   * Turns flat text into structured paragraphs. Short standalone lines in title
   * case or all caps become headings; bullet and numbered prefixes become list
   * paragraphs; page markers become page breaks.
   */
  private static buildParagraphs(text: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const blocks = text
      .replace(/\r\n/g, '\n')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    for (const block of blocks) {
      if (/^-{2,}\s*Page \d+\s*-{2,}$/i.test(block)) {
        paragraphs.push(new Paragraph({ children: [], pageBreakBefore: true }));
        continue;
      }

      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);

      for (const line of lines) {
        const bullet = line.match(/^[•▪◦*\u2022-]\s+(.*)$/);
        if (bullet) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(bullet[1])],
              bullet: { level: 0 },
            })
          );
          continue;
        }

        const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(`${numbered[1]}. ${numbered[2]}`)],
              indent: { left: 360 },
            })
          );
          continue;
        }

        const isHeading =
          lines.length === 1 &&
          line.length <= 80 &&
          !/[.!?;:,]$/.test(line) &&
          (line === line.toUpperCase() || /^[A-Z0-9]/.test(line));

        if (isHeading) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true })],
              heading:
                line.length <= 40 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 },
            })
          );
          continue;
        }

        paragraphs.push(
          new Paragraph({
            children: [new TextRun(line)],
            alignment: AlignmentType.LEFT,
          })
        );
      }
    }

    return paragraphs.length ? paragraphs : [new Paragraph({ children: [] })];
  }
}
