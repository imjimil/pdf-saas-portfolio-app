import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import archiver from 'archiver';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';
import { extractText } from '../lib/pdfText';
import * as poppler from './engines/poppler';

/**
 * PDF to EPUB.
 *
 * Writes a valid EPUB 3 package directly rather than using the unmaintained
 * epub-gen, so the output opens in Apple Books, Kindle and Calibre. Chapters
 * are detected from heading-like lines, with a page-count fallback, and the
 * text is styled for comfortable reading rather than dumped as one blob.
 */

export interface PdfToEpubOptions {
  title?: string;
  author?: string;
}

export interface PdfToEpubResult {
  outputPath: string;
  chapterCount: number;
}

interface Chapter {
  title: string;
  paragraphs: string[];
}

export class PdfToEpubService {
  static async convert(
    inputPath: string,
    outputPath: string,
    workDir: string,
    options: PdfToEpubOptions = {}
  ): Promise<PdfToEpubResult> {
    try {
      const pdf = await loadPdf(inputPath, { ignoreEncryption: false });

      const text = (await poppler.isAvailable())
        ? await poppler.toText(inputPath, { layout: false })
        : (await extractText(inputPath)).text;

      if (!text.trim()) {
        throw new AppError(
          'EMPTY_RESULT',
          'This PDF contains no selectable text, so it cannot be converted to an e-book.',
          'Run it through the PDF OCR tool first.'
        );
      }

      const title =
        options.title?.trim() ||
        pdf.getTitle()?.trim() ||
        path.basename(inputPath, path.extname(inputPath));
      const author = options.author?.trim() || pdf.getAuthor()?.trim() || 'Unknown';

      const chapters = buildChapters(text);
      const buildDir = path.join(workDir, 'epub');
      await writeEpubTree(buildDir, title, author, chapters);
      await zipEpub(buildDir, outputPath);

      return { outputPath, chapterCount: chapters.length };
    } catch (error) {
      throw toAppError(error, 'The PDF could not be converted to EPUB.');
    }
  }
}

// --- Content structuring -----------------------------------------------------

function buildChapters(text: string): Chapter[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const chapters: Chapter[] = [];

  let current: Chapter = { title: 'Beginning', paragraphs: [] };
  let buffer: string[] = [];

  const flushParagraph = () => {
    const joined = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) current.paragraphs.push(joined);
    buffer = [];
  };

  const flushChapter = () => {
    flushParagraph();
    if (current.paragraphs.length) chapters.push(current);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (isHeading(line)) {
      flushChapter();
      current = { title: line.slice(0, 90), paragraphs: [] };
      continue;
    }

    buffer.push(line);
  }

  flushChapter();

  if (!chapters.length) {
    return [{ title: 'Document', paragraphs: [text.replace(/\s+/g, ' ').trim()] }];
  }

  // Very long single chapters are hard to navigate; break them into sections.
  return chapters.flatMap((chapter) => {
    if (chapter.paragraphs.length <= 120) return [chapter];

    const sections: Chapter[] = [];
    for (let index = 0; index < chapter.paragraphs.length; index += 120) {
      sections.push({
        title:
          index === 0
            ? chapter.title
            : `${chapter.title} (continued ${Math.floor(index / 120) + 1})`,
        paragraphs: chapter.paragraphs.slice(index, index + 120),
      });
    }
    return sections;
  });
}

function isHeading(line: string): boolean {
  if (line.length > 80 || line.length < 3) return false;
  if (/[.!?,;:]$/.test(line)) return false;

  return (
    /^(chapter|part|section|appendix|introduction|conclusion|preface|epilogue|prologue)\b/i.test(line) ||
    /^\d+(\.\d+)*\.?\s+\S/.test(line) ||
    (line === line.toUpperCase() && /[A-Z]{3,}/.test(line))
  );
}

// --- EPUB packaging ----------------------------------------------------------

async function writeEpubTree(
  buildDir: string,
  title: string,
  author: string,
  chapters: Chapter[]
): Promise<void> {
  const oebps = path.join(buildDir, 'OEBPS');
  await fs.mkdir(path.join(buildDir, 'META-INF'), { recursive: true });
  await fs.mkdir(oebps, { recursive: true });

  await fs.writeFile(path.join(buildDir, 'mimetype'), 'application/epub+zip');

  await fs.writeFile(
    path.join(buildDir, 'META-INF', 'container.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  await fs.writeFile(
    path.join(oebps, 'style.css'),
    `body { font-family: Georgia, 'Iowan Old Style', serif; line-height: 1.65; margin: 5%; color: #1a1a1a; }
h1 { font-size: 1.5em; line-height: 1.25; margin: 1.4em 0 0.7em; page-break-before: always; }
p { margin: 0 0 0.9em; text-align: justify; hyphens: auto; }
@media (prefers-color-scheme: dark) { body { color: #e8e8e8; background: #121212; } }`
  );

  const files = chapters.map((chapter, index) => {
    const id = `chapter-${index + 1}`;
    return { id, href: `${id}.xhtml`, chapter };
  });

  await Promise.all(
    files.map(({ href, chapter }) =>
      fs.writeFile(
        path.join(oebps, href),
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(chapter.title)}</h1>
  ${chapter.paragraphs.map((text) => `<p>${escapeXml(text)}</p>`).join('\n  ')}
</body>
</html>`
      )
    )
  );

  const uid = `urn:uuid:${cryptoRandomUuid()}`;

  await fs.writeFile(
    path.join(oebps, 'content.opf'),
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${uid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="style" href="style.css" media-type="text/css"/>
${files.map(({ id, href }) => `    <item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine>
${files.map(({ id }) => `    <itemref idref="${id}"/>`).join('\n')}
  </spine>
</package>`
  );

  await fs.writeFile(
    path.join(oebps, 'nav.xhtml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="utf-8"/><title>Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${files.map(({ href, chapter }) => `      <li><a href="${href}">${escapeXml(chapter.title)}</a></li>`).join('\n')}
    </ol>
  </nav>
</body>
</html>`
  );
}

function zipEpub(buildDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    // The EPUB spec requires `mimetype` to be the first entry and stored
    // uncompressed. `store` is supported by archiver but missing from its types.
    archive.file(path.join(buildDir, 'mimetype'), {
      name: 'mimetype',
      store: true,
    } as archiver.EntryData);
    archive.directory(path.join(buildDir, 'META-INF'), 'META-INF');
    archive.directory(path.join(buildDir, 'OEBPS'), 'OEBPS');

    void archive.finalize();
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cryptoRandomUuid(): string {
  return require('crypto').randomUUID();
}
