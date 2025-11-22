import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export class PdfToTxtService {
  static async convert(pdfPath: string, outputPath: string): Promise<void> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text || 'No text content found in PDF.';
      await fs.writeFile(outputPath, text);
    } catch (error: any) {
      throw new Error(`PDF to Text conversion failed: ${error.message}`);
    }
  }
}

