import {
  FileText,
  FileType2,
  Image as ImageIcon,
  Scissors,
  Combine,
  Minimize2,
  AlignLeft,
  BookOpen,
  ScanText,
  Droplets,
  Lock,
  Unlock,
  LucideIcon,
} from 'lucide-react';

/**
 * Single source of truth for the tool catalogue.
 *
 * Navigation, the landing page, the tools grid and each tool screen all read
 * from here, so a tool can never again appear in one place and be missing from
 * another — which is how "Word to PDF" ended up absent from the nav.
 */

export type ToolCategory = 'convert' | 'organise' | 'optimise' | 'secure';

export interface Tool {
  id: string;
  name: string;
  path: string;
  /** One line, written for someone deciding whether this is the right tool. */
  summary: string;
  icon: LucideIcon;
  category: ToolCategory;
  /** `accept` attribute for the file input. */
  accept: string;
  multiple?: boolean;
  /** Shown as a small badge on cards. */
  badge?: string;
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  convert: 'Convert',
  organise: 'Organise',
  optimise: 'Optimise',
  secure: 'Secure',
};

const PDF_ACCEPT = 'application/pdf,.pdf';
const WORD_ACCEPT =
  '.docx,.doc,.odt,.rtf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';
const IMAGE_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.heic,.tiff,.gif';

export const TOOLS: Tool[] = [
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    path: '/pdf-to-word',
    summary: 'Turn a PDF into a fully editable Word document.',
    icon: FileType2,
    category: 'convert',
    accept: PDF_ACCEPT,
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    path: '/word-to-pdf',
    summary: 'Convert Word files to PDF with the layout kept intact.',
    icon: FileText,
    category: 'convert',
    accept: WORD_ACCEPT,
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    path: '/image-to-pdf',
    summary: 'Combine photos and scans into a single PDF.',
    icon: ImageIcon,
    category: 'convert',
    accept: IMAGE_ACCEPT,
    multiple: true,
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    path: '/pdf-to-text',
    summary: 'Pull clean, plain text out of any PDF.',
    icon: AlignLeft,
    category: 'convert',
    accept: PDF_ACCEPT,
  },
  {
    id: 'pdf-to-epub',
    name: 'PDF to EPUB',
    path: '/pdf-to-epub',
    summary: 'Make a reflowable e-book for Kindle and Apple Books.',
    icon: BookOpen,
    category: 'convert',
    accept: PDF_ACCEPT,
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    path: '/merge-pdf',
    summary: 'Join several PDFs into one, in any order you like.',
    icon: Combine,
    category: 'organise',
    accept: PDF_ACCEPT,
    multiple: true,
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    path: '/split-pdf',
    summary: 'Pull out the pages you need or break a file into parts.',
    icon: Scissors,
    category: 'organise',
    accept: PDF_ACCEPT,
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    path: '/compress-pdf',
    summary: 'Shrink large PDFs while keeping them readable.',
    icon: Minimize2,
    category: 'optimise',
    accept: PDF_ACCEPT,
  },
  {
    id: 'pdf-ocr',
    name: 'PDF OCR',
    path: '/pdf-ocr',
    summary: 'Read the text inside scanned pages and photos.',
    icon: ScanText,
    category: 'optimise',
    accept: PDF_ACCEPT,
    badge: 'Smart',
  },
  {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    path: '/watermark-pdf',
    summary: 'Stamp text across your pages to mark ownership.',
    icon: Droplets,
    category: 'secure',
    accept: PDF_ACCEPT,
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    path: '/protect-pdf',
    summary: 'Lock a PDF with a password and AES-256 encryption.',
    icon: Lock,
    category: 'secure',
    accept: PDF_ACCEPT,
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    path: '/unlock-pdf',
    summary: 'Remove a password you know from a PDF so it opens freely.',
    icon: Unlock,
    category: 'secure',
    accept: PDF_ACCEPT,
  },
];

export const getTool = (id: string): Tool | undefined =>
  TOOLS.find((tool) => tool.id === id);

/** True when `accept` (an input's accept attribute) would allow this file. */
function accepts(accept: string, file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return accept.split(',').some((entry) => {
    const rule = entry.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/**
 * The tools that can actually open this file, so the landing page can offer a
 * real choice once something has been dropped rather than a generic menu.
 */
export const toolsAcceptingFile = (file: File): Tool[] =>
  TOOLS.filter((tool) => accepts(tool.accept, file));

export const toolsByCategory = (): Array<{ category: ToolCategory; tools: Tool[] }> =>
  (Object.keys(CATEGORY_LABELS) as ToolCategory[]).map((category) => ({
    category,
    tools: TOOLS.filter((tool) => tool.category === category),
  }));
