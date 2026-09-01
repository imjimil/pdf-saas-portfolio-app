import fs from 'fs/promises';
import path from 'path';
import { run } from '../../lib/exec';
import { getCapabilities } from '../../lib/binaries';

/**
 * Poppler utilities. `pdftotext -layout` preserves the visual column and table
 * structure of a page, which plain text extraction libraries flatten away.
 */

export async function isAvailable(): Promise<boolean> {
  return (await getCapabilities()).poppler;
}

export interface PdfInfo {
  pages: number;
  encrypted: boolean;
  title?: string;
  author?: string;
}

export async function info(inputPath: string): Promise<PdfInfo> {
  const { stdout } = await run('pdfinfo', [inputPath], { timeoutMs: 30_000 });

  const field = (name: string): string | undefined =>
    stdout.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim();

  return {
    pages: Number(field('Pages') ?? 0),
    encrypted: (field('Encrypted') ?? 'no').toLowerCase().startsWith('yes'),
    title: field('Title') || undefined,
    author: field('Author') || undefined,
  };
}

/** Extracts text, keeping the page's visual layout. */
export async function toText(
  inputPath: string,
  options: { layout?: boolean; firstPage?: number; lastPage?: number } = {}
): Promise<string> {
  const args: string[] = [];
  if (options.layout !== false) args.push('-layout');
  if (options.firstPage) args.push('-f', String(options.firstPage));
  if (options.lastPage) args.push('-l', String(options.lastPage));
  args.push('-enc', 'UTF-8', inputPath, '-');

  const { stdout } = await run('pdftotext', args, { timeoutMs: 120_000 });
  return stdout;
}

/** Renders pages to PNG images; used to feed OCR. */
export async function toImages(
  inputPath: string,
  outDir: string,
  options: { dpi?: number; firstPage?: number; lastPage?: number } = {}
): Promise<string[]> {
  const { dpi = 200, firstPage, lastPage } = options;
  await fs.mkdir(outDir, { recursive: true });
  const prefix = path.join(outDir, 'page');

  const args = ['-png', '-r', String(dpi)];
  if (firstPage) args.push('-f', String(firstPage));
  if (lastPage) args.push('-l', String(lastPage));
  args.push(inputPath, prefix);

  await run('pdftoppm', args, { timeoutMs: 240_000 });

  const files = await fs.readdir(outDir);
  return files
    .filter((name) => name.startsWith('page') && name.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(outDir, name));
}

/** Extracts embedded images so PDF to EPUB can keep illustrations. */
export async function extractImages(
  inputPath: string,
  outDir: string,
  maxPages = 50
): Promise<string[]> {
  await fs.mkdir(outDir, { recursive: true });
  const prefix = path.join(outDir, 'img');

  try {
    await run('pdfimages', ['-png', '-l', String(maxPages), inputPath, prefix], {
      timeoutMs: 180_000,
    });
  } catch {
    return [];
  }

  const files = await fs.readdir(outDir);
  return files
    .filter((name) => name.startsWith('img') && name.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(outDir, name));
}
