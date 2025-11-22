import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import sharp from 'sharp';

export class ImageToPdfService {
  static async convert(imagePath: string, outputPath: string): Promise<void> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const pdfDoc = await PDFDocument.create();
      
      // Get image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 612;
      const height = metadata.height || 792;
      
      // Determine image type and embed accordingly
      let image;
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        const jpgBuffer = await sharp(imageBuffer).jpeg().toBuffer();
        image = await pdfDoc.embedJpg(jpgBuffer);
      } else if (metadata.format === 'png') {
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        image = await pdfDoc.embedPng(pngBuffer);
      } else {
        // Convert to PNG for other formats
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        image = await pdfDoc.embedPng(pngBuffer);
      }
      
      // Create page with image dimensions (A4 size if too large)
      const maxWidth = 612;
      const maxHeight = 792;
      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      
      const page = pdfDoc.addPage([width * scale, height * scale]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width * scale,
        height: height * scale,
      });
      
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);
    } catch (error: any) {
      throw new Error(`Image to PDF conversion failed: ${error.message}`);
    }
  }
}

