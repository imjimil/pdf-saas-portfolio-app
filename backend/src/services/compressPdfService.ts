import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

export class CompressPdfService {
  static async compress(pdfPath: string, outputPath: string): Promise<void> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(dataBuffer);
      
      // Create a new PDF and copy pages (this removes some metadata and can reduce size)
      const compressedPdf = await PDFDocument.create();
      const pages = await compressedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      
      pages.forEach((page) => compressedPdf.addPage(page));
      
      // Save with compression options
      const pdfBytes = await compressedPdf.save({
        useObjectStreams: false, // Can help with compression
        addDefaultPage: false,
      });
      
      await fs.writeFile(outputPath, pdfBytes);
    } catch (error: any) {
      throw new Error(`PDF compression failed: ${error.message}`);
    }
  }
}

