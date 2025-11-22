import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

export class MergePdfService {
  static async merge(pdfPaths: string[], outputPath: string): Promise<void> {
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfPath of pdfPaths) {
        const pdfBytes = await fs.readFile(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      await fs.writeFile(outputPath, mergedPdfBytes);
    } catch (error: any) {
      throw new Error(`PDF merge failed: ${error.message}`);
    }
  }
}

