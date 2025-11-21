import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs/promises';
import path from 'path';

// Try to import canvas, but handle if it fails
let createCanvas: any;
try {
  createCanvas = require('canvas').createCanvas;
} catch (error) {
  console.warn('Canvas not available, OCR will use fallback text extraction');
  createCanvas = null;
}

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class OCRService {
  // Convert PDF pages to images using pdfjs-dist and canvas
  private static async pdfPagesToImages(pdfPath: string): Promise<string[]> {
    const imagePaths: string[] = [];
    const uploadDir = path.dirname(pdfPath);
    
    // If canvas is not available, return empty array (will use fallback)
    if (!createCanvas) {
      return [];
    }
    
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
      const numPages = pdf.numPages;
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context as any,
          viewport: viewport,
        } as any).promise;
        
        // Convert canvas to buffer and save as image
        const imageBuffer = canvas.toBuffer('image/png');
        const imagePath = path.join(uploadDir, `page_${pageNum}_${Date.now()}.png`);
        await fs.writeFile(imagePath, imageBuffer);
        imagePaths.push(imagePath);
      }
      
      return imagePaths;
    } catch (error: any) {
      // Clean up any created images on error
      for (const imgPath of imagePaths) {
        await fs.unlink(imgPath).catch(() => {});
      }
      // Return empty array to trigger fallback
      return [];
    }
  }

  // Extract text from PDF using OCR
  static async extractTextFromPdf(pdfPath: string): Promise<string> {
    let worker: any = null;
    const imagePaths: string[] = [];
    
    try {
      // First, try to extract text directly (for PDFs with embedded text)
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      // If we got substantial text, use it (but still try OCR for better accuracy)
      if (pdfData.text && pdfData.text.trim().length > 50) {
        // For PDFs with text, we can return it directly or enhance with OCR
        // For now, let's still do OCR for better results
      }
      
      // Convert PDF pages to images
      const pageImages = await this.pdfPagesToImages(pdfPath);
      imagePaths.push(...pageImages);
      
      if (pageImages.length === 0) {
        // Fallback to text extraction if image conversion fails
        return pdfData.text || 'No text could be extracted from this PDF.';
      }
      
      // Initialize Tesseract worker
      worker = await createWorker('eng');
      let fullText = '';
      
      // Process each page image with OCR
      for (const imagePath of pageImages) {
        try {
          const { data: { text } } = await worker.recognize(imagePath);
          fullText += text + '\n\n';
        } catch (ocrError: any) {
          console.error(`OCR error for ${imagePath}:`, ocrError);
        }
      }
      
      await worker.terminate();
      worker = null;
      
      // Clean up temporary images
      for (const imgPath of imagePaths) {
        await fs.unlink(imgPath).catch(() => {});
      }
      
      return fullText.trim() || pdfData.text || 'No text could be extracted from this PDF.';
    } catch (error: any) {
      // Clean up worker if still active
      if (worker) {
        await worker.terminate().catch(() => {});
      }
      
      // Clean up images
      for (const imgPath of imagePaths) {
        await fs.unlink(imgPath).catch(() => {});
      }
      
      // Fallback to text extraction
      try {
        const dataBuffer = await fs.readFile(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        return pdfData.text || 'No text could be extracted from this PDF.';
      } catch (fallbackError: any) {
        throw new Error(`OCR extraction failed: ${error.message}`);
      }
    }
  }

  // Alternative: OCR from image file directly
  static async extractTextFromImage(imagePath: string): Promise<string> {
    let worker: any = null;
    try {
      worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();
      return text;
    } catch (error: any) {
      if (worker) {
        await worker.terminate().catch(() => {});
      }
      throw new Error(`OCR from image failed: ${error.message}`);
    }
  }

  // Process PDF with OCR
  static async processPdfWithOcr(pdfPath: string, outputPath: string): Promise<void> {
    try {
      const text = await this.extractTextFromPdf(pdfPath);
      await fs.writeFile(outputPath, text);
    } catch (error: any) {
      // Final fallback: try to extract text without OCR
      try {
        const dataBuffer = await fs.readFile(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        const extractedText = pdfData.text || 'No text could be extracted from this PDF. This might be a scanned document that requires OCR processing.';
        await fs.writeFile(outputPath, extractedText);
      } catch (fallbackError: any) {
        throw new Error(`OCR processing failed: ${error.message}`);
      }
    }
  }
}

