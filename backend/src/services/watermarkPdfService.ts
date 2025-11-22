import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';

export class WatermarkPdfService {
  static async addWatermark(
    pdfPath: string,
    outputPath: string,
    watermarkText: string,
    options?: {
      position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      opacity?: number;
      fontSize?: number;
      rotation?: number;
      color?: { r: number; g: number; b: number };
    }
  ): Promise<void> {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      
      // Load PDF document
      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(pdfBytes);
      } catch (loadError: any) {
        if (loadError.message && (loadError.message.includes('encrypt') || loadError.message.includes('password'))) {
          throw new Error('Cannot watermark password-protected PDFs. Please remove the password first.');
        }
        throw loadError;
      }
      
      const pages = pdfDoc.getPages();
      const position = options?.position || 'center';
      const opacity = options?.opacity || 0.3;
      const fontSize = options?.fontSize || 50;
      const rotation = options?.rotation || -45;
      const color = options?.color || { r: 0, g: 0, b: 0 };
      
      // Embed font
      let font;
      try {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      } catch (fontError: any) {
        throw new Error(`Failed to embed font: ${fontError.message}`);
      }
      
      // Calculate position based on option
      for (const page of pages) {
        const { width, height } = page.getSize();
        let x = width / 2;
        let y = height / 2;
        
        switch (position) {
          case 'top-left':
            x = width * 0.1;
            y = height * 0.9;
            break;
          case 'top-right':
            x = width * 0.9;
            y = height * 0.9;
            break;
          case 'bottom-left':
            x = width * 0.1;
            y = height * 0.1;
            break;
          case 'bottom-right':
            x = width * 0.9;
            y = height * 0.1;
            break;
          case 'center':
          default:
            x = width / 2;
            y = height / 2;
            break;
        }
        
        // Calculate text width for centering
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        x -= textWidth / 2;
        
        // Note: Rotation is complex in pdf-lib, drawing without rotation for now
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
        });
      }
      
      // Save PDF
      let pdfBytesModified: Uint8Array;
      try {
        pdfBytesModified = await pdfDoc.save();
      } catch (saveError: any) {
        throw new Error(`Failed to save watermarked PDF: ${saveError.message}`);
      }
      
      // Write to file
      try {
        await fs.writeFile(outputPath, pdfBytesModified);
      } catch (writeError: any) {
        throw new Error(`Failed to write watermarked PDF file: ${writeError.message}`);
      }
    } catch (error: any) {
      console.error('Watermark error details:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Watermark addition failed: ${error.message || 'Unknown error'}`);
    }
  }
}

