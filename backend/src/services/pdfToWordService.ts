import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export class PdfToWordService {
  static async convert(pdfPath: string, outputPath: string): Promise<void> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Extract text and create a simple RTF-like format that Word can open
      // Note: This creates a text file. For full DOCX support, consider using docx library
      const text = pdfData.text || 'No text content found in PDF.';
      
      // Create a simple text file (Word can open .txt files)
      // For portfolio purposes, this demonstrates the functionality
      await fs.writeFile(outputPath.replace('.docx', '.txt'), text);
      
      // If outputPath has .docx extension, we'll create .txt instead
      // In production, you'd use a proper DOCX library like 'docx'
      if (outputPath.endsWith('.docx')) {
        const txtPath = outputPath.replace('.docx', '.txt');
        await fs.writeFile(txtPath, text);
        // Rename to indicate it's a text extraction
        throw new Error('PDF to Word: Text extracted. For full DOCX conversion, additional libraries are needed.');
      }
    } catch (error: any) {
      // If it's our custom error, rethrow it
      if (error.message.includes('PDF to Word:')) {
        throw error;
      }
      throw new Error(`PDF to Word conversion failed: ${error.message}`);
    }
  }
}

