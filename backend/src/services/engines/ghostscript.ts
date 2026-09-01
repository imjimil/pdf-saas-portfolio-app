import fs from 'fs/promises';
import { run } from '../../lib/exec';
import { AppError } from '../../lib/errors';
import { getCapabilities } from '../../lib/binaries';

/**
 * Ghostscript performs genuine PDF compression: it downsamples and re-encodes
 * embedded images, subsets fonts and rewrites the object tree. This is the
 * difference between actually shrinking a file and merely re-saving it.
 */

export type CompressionLevel = 'light' | 'balanced' | 'strong' | 'extreme';

interface LevelSettings {
  /** Ghostscript's built-in preset. */
  preset: string;
  /** Target DPI for colour and greyscale images. */
  imageDpi: number;
  /** Target DPI for 1-bit images. */
  monoDpi: number;
}

const LEVELS: Record<CompressionLevel, LevelSettings> = {
  light: { preset: '/prepress', imageDpi: 200, monoDpi: 600 },
  balanced: { preset: '/ebook', imageDpi: 150, monoDpi: 450 },
  strong: { preset: '/ebook', imageDpi: 110, monoDpi: 300 },
  extreme: { preset: '/screen', imageDpi: 72, monoDpi: 200 },
};

export async function isAvailable(): Promise<boolean> {
  return (await getCapabilities()).ghostscript;
}

export async function compress(
  inputPath: string,
  outputPath: string,
  level: CompressionLevel = 'balanced'
): Promise<void> {
  if (!(await isAvailable())) {
    throw new AppError(
      'ENGINE_UNAVAILABLE',
      'The PDF compression engine is not available on this server.'
    );
  }

  const settings = LEVELS[level] ?? LEVELS.balanced;

  await run(
    'gs',
    [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.7',
      `-dPDFSETTINGS=${settings.preset}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',

      '-dDownsampleColorImages=true',
      '-dColorImageDownsampleType=/Bicubic',
      `-dColorImageResolution=${settings.imageDpi}`,

      '-dDownsampleGrayImages=true',
      '-dGrayImageDownsampleType=/Bicubic',
      `-dGrayImageResolution=${settings.imageDpi}`,

      '-dDownsampleMonoImages=true',
      '-dMonoImageDownsampleType=/Subsample',
      `-dMonoImageResolution=${settings.monoDpi}`,

      `-sOutputFile=${outputPath}`,
      inputPath,
    ],
    { timeoutMs: 240_000 }
  );

  const stat = await fs.stat(outputPath).catch(() => null);
  if (!stat || stat.size === 0) {
    throw new AppError('PROCESSING_FAILED', 'Compression produced an empty file.');
  }
}

/** Rewrites a PDF to repair structural damage other tools reject. */
export async function repair(inputPath: string, outputPath: string): Promise<void> {
  await run(
    'gs',
    [
      '-o',
      outputPath,
      '-sDEVICE=pdfwrite',
      '-dPDFSETTINGS=/prepress',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
      inputPath,
    ],
    { timeoutMs: 180_000 }
  );
}
