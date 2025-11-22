import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export class SplitPdfService {
  static async split(
    pdfPath: string,
    outputDir: string,
    pageRanges?: { start: number; end: number }[]
  ): Promise<string[]> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(dataBuffer);
      const totalPages = pdfDoc.getPageCount();
      
      const outputFiles: string[] = [];
      
      if (pageRanges && pageRanges.length > 0) {
        // Collect all page indices from all ranges into a single array
        const pageIndices: number[] = [];
        
        for (const range of pageRanges) {
          // Validate range
          if (range.start < 1 || range.end > totalPages || range.start > range.end) {
            throw new Error(`Invalid page range: ${range.start}-${range.end}. PDF has ${totalPages} pages.`);
          }
          
          // Add all pages in this range (convert from 1-based to 0-based indexing)
          for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
            const pageIndex = pageNum - 1; // Convert to 0-based
            if (!pageIndices.includes(pageIndex)) {
              pageIndices.push(pageIndex);
            }
          }
        }
        
        // Sort page indices to maintain order
        pageIndices.sort((a, b) => a - b);
        
        if (pageIndices.length === 0) {
          throw new Error('No valid pages to extract');
        }
        
        // Create a single PDF with all specified pages
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const outputPath = path.join(outputDir, 'split_pages.pdf');
        await fs.writeFile(outputPath, pdfBytes);
        outputFiles.push(outputPath);
      } else {
        // Split into individual pages (if no ranges specified)
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          const outputPath = path.join(outputDir, `page_${i + 1}.pdf`);
          await fs.writeFile(outputPath, pdfBytes);
          outputFiles.push(outputPath);
        }
      }
      
      return outputFiles;
    } catch (error: any) {
      throw new Error(`PDF split failed: ${error.message}`);
    }
  }
}

