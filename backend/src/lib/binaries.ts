import { probe } from './exec';

/**
 * Which document engines this server can actually use.
 *
 * Production (Docker) has all of them. A developer laptop running `npm run dev`
 * usually has none, so every service checks these flags and falls back to a
 * pure-JavaScript path rather than crashing.
 */
export interface Capabilities {
  libreoffice: boolean;
  ghostscript: boolean;
  qpdf: boolean;
  poppler: boolean;
  tesseract: boolean;
  pdf2docx: boolean;
}

let cached: Capabilities | null = null;
let inflight: Promise<Capabilities> | null = null;

async function detect(): Promise<Capabilities> {
  const [libreoffice, ghostscript, qpdf, poppler, tesseract, pdf2docx] =
    await Promise.all([
      probe('soffice', ['--version']),
      probe('gs', ['--version']),
      probe('qpdf', ['--version']),
      probe('pdftoppm', ['-v']),
      probe('tesseract', ['--version']),
      probe('python3', ['-c', 'import pdf2docx']),
    ]);

  return { libreoffice, ghostscript, qpdf, poppler, tesseract, pdf2docx };
}

export async function getCapabilities(): Promise<Capabilities> {
  if (cached) return cached;
  if (!inflight) {
    inflight = detect().then((result) => {
      cached = result;
      inflight = null;
      return result;
    });
  }
  return inflight;
}

export async function logCapabilities(): Promise<void> {
  const caps = await getCapabilities();
  const enabled = Object.entries(caps)
    .filter(([, ok]) => ok)
    .map(([name]) => name);
  const missing = Object.entries(caps)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  console.log(
    `Document engines available: ${enabled.length ? enabled.join(', ') : 'none'}`
  );
  if (missing.length) {
    console.warn(
      `Document engines missing: ${missing.join(', ')} — affected tools will use ` +
        'reduced-fidelity JavaScript fallbacks.'
    );
  }
}
