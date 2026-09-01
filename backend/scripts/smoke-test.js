/* Exercises every tool endpoint against a running server and reports results. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const sharp = require('sharp');

const BASE = process.env.API_URL || 'http://localhost:5001/api';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-'));

async function makePdf(pages = 5) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= pages; i += 1) {
    const page = pdf.addPage([595, 842]);
    page.drawText(`Quarterly Report`, { x: 56, y: 760, size: 24, font: bold });
    page.drawText(`Section ${i}`, { x: 56, y: 720, size: 16, font: bold });
    for (let line = 0; line < 12; line += 1) {
      page.drawText(
        `This is line ${line + 1} of page ${i} with readable content for extraction.`,
        { x: 56, y: 680 - line * 20, size: 11, font, color: rgb(0.1, 0.1, 0.1) }
      );
    }
  }
  const file = path.join(TMP, `doc-${pages}.pdf`);
  fs.writeFileSync(file, await pdf.save());
  return file;
}

async function makeDocx() {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Project Proposal', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun('Prepared for the board.')] }),
          new Paragraph({ text: 'Background', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [new TextRun('A longer paragraph that should wrap across several lines in the produced PDF so we can confirm text layout works correctly end to end.')],
          }),
          new Paragraph({ text: 'First bullet', bullet: { level: 0 } }),
          new Paragraph({ text: 'Second bullet', bullet: { level: 0 } }),
        ],
      },
    ],
  });
  const file = path.join(TMP, 'proposal.docx');
  fs.writeFileSync(file, await Packer.toBuffer(doc));
  return file;
}

async function makeImage() {
  const file = path.join(TMP, 'photo.jpg');
  await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 40, g: 120, b: 200 } },
  })
    .jpeg()
    .toFile(file);
  return file;
}

async function call(endpoint, files, fields = {}) {
  const form = new FormData();
  for (const { field, file } of files) {
    form.append(field, new Blob([fs.readFileSync(file)]), path.basename(file));
  }
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, String(value));
  }

  const response = await fetch(`${BASE}${endpoint}`, { method: 'POST', body: form });
  const type = response.headers.get('content-type') || '';

  if (!response.ok) {
    const body = type.includes('json') ? await response.json() : await response.text();
    return { ok: false, status: response.status, body };
  }

  if (type.includes('json')) {
    return { ok: true, json: await response.json() };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const rawMeta = response.headers.get('x-result-meta');
  const meta = rawMeta ? JSON.parse(decodeURIComponent(rawMeta)) : {};
  return {
    ok: true,
    buffer,
    bytes: buffer.length,
    magic: buffer.subarray(0, 4).toString('latin1'),
    disposition: response.headers.get('content-disposition'),
    meta,
  };
}

const results = [];
function report(name, result, validate) {
  if (!result.ok) {
    results.push({ name, status: 'FAIL', detail: JSON.stringify(result.body).slice(0, 160) });
    return;
  }
  const problem = validate?.(result);
  results.push(
    problem
      ? { name, status: 'FAIL', detail: problem }
      : {
          name,
          status: 'PASS',
          detail: result.json
            ? `json ${result.json.wordCount ?? ''} words`
            : `${result.bytes} bytes ${JSON.stringify(result.meta)}`,
        }
  );
}

(async () => {
  const pdf5 = await makePdf(5);
  const pdf3 = await makePdf(3);
  const docx = await makeDocx();
  const image = await makeImage();

  report(
    'PDF to Word (.docx)',
    await call('/pdf/to-word', [{ field: 'file', file: pdf5 }]),
    (r) => (r.magic?.startsWith('PK') ? null : `expected DOCX zip, got "${r.magic}"`)
  );

  report(
    'Word to PDF',
    await call('/pdf/word-to-pdf', [{ field: 'file', file: docx }]),
    (r) => (r.magic === '%PDF' ? null : `expected PDF, got "${r.magic}"`)
  );

  report(
    'Images to PDF (multi)',
    await call('/pdf/image-to-pdf', [
      { field: 'files', file: image },
      { field: 'files', file: image },
    ], { pageSize: 'a4' }),
    (r) => (Number(r.meta.pages) === 2 ? null : `expected 2 pages, got ${r.meta.pages}`)
  );

  report(
    'Split by ranges',
    await call('/pdf/split', [{ field: 'file', file: pdf5 }], {
      mode: 'ranges',
      pageRanges: '1-2,4',
    }),
    (r) => (Number(r.meta.pages) === 3 ? null : `expected 3 pages, got ${r.meta.pages}`)
  );

  report(
    'Split all pages (ZIP)',
    await call('/pdf/split', [{ field: 'file', file: pdf5 }], { mode: 'all' }),
    (r) =>
      r.magic?.startsWith('PK') && Number(r.meta.documents) === 5
        ? null
        : `expected ZIP of 5, got ${r.magic} / ${r.meta.documents}`
  );

  report(
    'Merge PDFs',
    await call('/pdf/merge', [
      { field: 'files', file: pdf5 },
      { field: 'files', file: pdf3 },
    ]),
    (r) => (Number(r.meta.pages) === 8 ? null : `expected 8 pages, got ${r.meta.pages}`)
  );

  report(
    'Compress PDF',
    await call('/pdf/compress', [{ field: 'file', file: pdf5 }]),
    (r) =>
      Number(r.meta.compressedSize) <= Number(r.meta.originalSize)
        ? null
        : 'output is larger than input'
  );

  report(
    'Watermark PDF',
    await call('/pdf/watermark', [{ field: 'file', file: pdf5 }], {
      watermarkText: 'CONFIDENTIAL',
      position: 'center',
      rotation: -45,
    }),
    (r) => (Number(r.meta.pages) === 5 ? null : `expected 5 pages, got ${r.meta.pages}`)
  );

  const protectedPdf = await call('/pdf/protect', [{ field: 'file', file: pdf5 }], {
    password: 'secret123',
  });
  report('Protect PDF (AES-256)', protectedPdf, (r) =>
    r.magic === '%PDF' ? null : `expected PDF, got "${r.magic}"`
  );

  // Unlock is only meaningful against a genuinely encrypted file, so it reuses
  // the output above rather than a fixture that was never locked.
  if (protectedPdf.ok) {
    const lockedFile = path.join(TMP, 'locked.pdf');
    fs.writeFileSync(lockedFile, protectedPdf.buffer);

    report(
      'Unlock PDF (correct password)',
      await call('/pdf/unlock', [{ field: 'file', file: lockedFile }], {
        password: 'secret123',
      }),
      (r) => (r.magic === '%PDF' ? null : `expected PDF, got "${r.magic}"`)
    );

    const wrongPassword = await call('/pdf/unlock', [{ field: 'file', file: lockedFile }], {
      password: 'not-the-password',
    });
    results.push({
      name: 'Rejects wrong password',
      status: wrongPassword.status === 400 ? 'PASS' : 'FAIL',
      detail: `${wrongPassword.status} ${wrongPassword.body?.message ?? ''}`.slice(0, 120),
    });
  }

  report(
    'PDF to text',
    await call('/pdf/to-txt', [{ field: 'file', file: pdf5 }]),
    (r) => (Number(r.meta.words) > 50 ? null : `only ${r.meta.words} words extracted`)
  );

  report(
    'PDF to EPUB',
    await call('/pdf/to-epub', [{ field: 'file', file: pdf5 }]),
    (r) => (r.magic?.startsWith('PK') ? null : `expected EPUB zip, got "${r.magic}"`)
  );

  report('OCR / text extraction', await call('/pdf/ocr', [{ field: 'file', file: pdf5 }]), (r) =>
    r.json?.wordCount > 20 ? null : 'no text returned'
  );

  // Error handling should be specific, not a generic 500.
  const badRange = await call('/pdf/split', [{ field: 'file', file: pdf3 }], {
    mode: 'ranges',
    pageRanges: '1-99',
  });
  results.push({
    name: 'Rejects out-of-range pages',
    status: badRange.status === 400 ? 'PASS' : 'FAIL',
    detail: `${badRange.status} ${badRange.body?.message ?? ''}`.slice(0, 120),
  });

  const notPdf = await call('/pdf/compress', [{ field: 'file', file: image }]);
  results.push({
    name: 'Rejects wrong file type',
    status: notPdf.status === 415 || notPdf.status === 400 ? 'PASS' : 'FAIL',
    detail: `${notPdf.status} ${notPdf.body?.message ?? ''}`.slice(0, 120),
  });

  console.log('');
  for (const { name, status, detail } of results) {
    console.log(`${status === 'PASS' ? 'PASS' : 'FAIL'}  ${name.padEnd(28)} ${detail}`);
  }
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);

  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
