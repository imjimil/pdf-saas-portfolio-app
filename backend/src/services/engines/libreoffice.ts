import fs from 'fs/promises';
import path from 'path';
import { run } from '../../lib/exec';
import { AppError } from '../../lib/errors';
import { getCapabilities } from '../../lib/binaries';

/**
 * LibreOffice in headless mode. This is what gives Word to PDF real fidelity:
 * fonts, images, tables, headers, page breaks and styles are preserved because
 * the same layout engine that renders the document also writes the PDF.
 */

/**
 * Each conversion gets a private profile, because two LibreOffice processes
 * sharing one profile directory will block on its lock file.
 *
 * Building a profile from scratch costs a few seconds, so the image creates a
 * warm one at build time and each job starts from a copy of it.
 */
const SEED_PROFILE = path.join(process.env.HOME || '/tmp', '.lo-profile');

async function makeProfile(workDir: string): Promise<string> {
  const profile = path.join(workDir, '.lo-profile');

  try {
    await fs.cp(SEED_PROFILE, profile, { recursive: true });
  } catch {
    // No seed profile (local dev): LibreOffice will create one itself.
  }

  return `-env:UserInstallation=file://${profile}`;
}

export async function isAvailable(): Promise<boolean> {
  return (await getCapabilities()).libreoffice;
}

export interface ConvertOptions {
  /** Target format, e.g. 'pdf', 'docx', 'html'. */
  to: string;
  /** Optional LibreOffice import filter, e.g. 'writer_pdf_import'. */
  inputFilter?: string;
  timeoutMs?: number;
}

/**
 * Converts `inputPath` into `outDir` and returns the produced file path.
 * LibreOffice always names the output after the input's basename.
 */
export async function convert(
  inputPath: string,
  outDir: string,
  options: ConvertOptions
): Promise<string> {
  if (!(await isAvailable())) {
    throw new AppError(
      'ENGINE_UNAVAILABLE',
      'The document conversion engine is not available on this server.'
    );
  }

  const { to, inputFilter, timeoutMs = 180_000 } = options;
  const filter = inputFilter ? `${to}:${inputFilter}` : to;

  await fs.mkdir(outDir, { recursive: true });
  const profile = await makeProfile(outDir);

  await run(
    'soffice',
    [
      '--headless',
      '--norestore',
      '--nolockcheck',
      '--nodefault',
      '--nofirststartwizard',
      profile,
      '--convert-to',
      filter,
      '--outdir',
      outDir,
      inputPath,
    ],
    { timeoutMs, cwd: outDir, env: { HOME: outDir } }
  );

  const expected = path.join(
    outDir,
    `${path.basename(inputPath, path.extname(inputPath))}.${to.split(':')[0]}`
  );

  try {
    await fs.access(expected);
    return expected;
  } catch {
    // Fall through: LibreOffice occasionally normalises the output filename.
  }

  const produced = (await fs.readdir(outDir)).filter((name) =>
    name.toLowerCase().endsWith(`.${to.split(':')[0].toLowerCase()}`)
  );

  if (!produced.length) {
    throw new AppError(
      'PROCESSING_FAILED',
      'The document could not be converted. It may be corrupted or use an unsupported format.'
    );
  }

  return path.join(outDir, produced[0]);
}

/** Word/ODT/RTF/TXT to PDF. */
export async function toPdf(inputPath: string, outDir: string): Promise<string> {
  return convert(inputPath, outDir, { to: 'pdf' });
}

/**
 * PDF to DOCX via LibreOffice's PDF import.
 * Lower quality than pdf2docx (produces positioned text frames), so it is only
 * used when pdf2docx is unavailable.
 */
export async function pdfToDocx(inputPath: string, outDir: string): Promise<string> {
  return convert(inputPath, outDir, {
    to: 'docx',
    inputFilter: 'writer_pdf_import',
    timeoutMs: 240_000,
  });
}
