/**
 * The canonical set of tool identifiers.
 *
 * The File and Usage models previously carried different enums, so recording a
 * `word-to-pdf` job failed validation and silently vanished from history.
 */
export const OPERATIONS = [
  'pdf-to-word',
  'word-to-pdf',
  'image-to-pdf',
  'pdf-to-text',
  'pdf-to-epub',
  'split',
  'merge',
  'compress',
  'watermark',
  'protect',
  'unlock',
  'ocr',
] as const;

export type Operation = (typeof OPERATIONS)[number];

export const OPERATION_LABELS: Record<Operation, string> = {
  'pdf-to-word': 'PDF to Word',
  'word-to-pdf': 'Word to PDF',
  'image-to-pdf': 'Image to PDF',
  'pdf-to-text': 'PDF to Text',
  'pdf-to-epub': 'PDF to EPUB',
  split: 'Split PDF',
  merge: 'Merge PDF',
  compress: 'Compress PDF',
  watermark: 'Watermark PDF',
  protect: 'Protect PDF',
  unlock: 'Unlock PDF',
  ocr: 'PDF OCR',
};
