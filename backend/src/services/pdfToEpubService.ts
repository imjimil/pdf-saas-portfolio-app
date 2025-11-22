import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
// @ts-ignore - epub-gen doesn't have types
const Epub = require('epub-gen');

export class PdfToEpubService {
  static async convert(pdfPath: string, outputPath: string): Promise<void> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text || 'No text content found in PDF.';
      
      // Split text into chapters (by double newlines or page breaks)
      const chapters = text.split(/\n\s*\n/).filter(ch => ch.trim().length > 0);
      
      const content = chapters.map((chapter, index) => ({
        title: `Chapter ${index + 1}`,
        data: chapter.trim(),
      }));
      
      const epubOptions = {
        title: 'Converted PDF',
        author: 'PDF Converter',
        content: content.length > 0 ? content : [{ title: 'Content', data: text }],
        output: outputPath,
      };
      
      await new Epub(epubOptions).promise;
    } catch (error: any) {
      throw new Error(`PDF to EPUB conversion failed: ${error.message}`);
    }
  }
}

