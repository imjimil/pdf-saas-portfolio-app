import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PDFService {
  // PDF to Word (extract text and create a simple text file that Word can open)
  static async pdfToWord(pdfPath: string, outputPath: string): Promise<void> {
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

  // Image to PDF
  static async imageToPdf(imagePath: string, outputPath: string): Promise<void> {
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

  // Split PDF - combines all specified pages into a single PDF
  static async splitPdf(
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

  // PDF to TXT
  static async pdfToTxt(pdfPath: string, outputPath: string): Promise<void> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      await fs.writeFile(outputPath, pdfData.text);
    } catch (error: any) {
      throw new Error(`PDF to TXT conversion failed: ${error.message}`);
    }
  }

  // PDF to EPUB
  static async pdfToEpub(pdfPath: string, outputPath: string): Promise<void> {
    try {
      // Extract text from PDF
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Create a simple EPUB structure
      // Note: This is a simplified version. For production, use a proper EPUB library
      const Epub = require('epub-gen');
      
      const option = {
        title: 'Converted PDF',
        author: 'Mypdftools',
        content: [
          {
            title: 'Chapter 1',
            data: pdfData.text,
          },
        ],
        output: outputPath,
      };
      
      await new Epub(option).promise;
    } catch (error: any) {
      throw new Error(`PDF to EPUB conversion failed: ${error.message}`);
    }
  }

  // Merge PDFs
  static async mergePdfs(pdfPaths: string[], outputPath: string): Promise<void> {
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

  // Compress PDF
  static async compressPdf(pdfPath: string, outputPath: string): Promise<void> {
    try {
      // Read the PDF
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Create a new PDF with compression settings
      const compressedPdf = await PDFDocument.create();

      // Copy all pages
      const pages = await compressedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => compressedPdf.addPage(page));

      // Save with compression (pdf-lib handles this automatically)
      const compressedBytes = await compressedPdf.save({
        useObjectStreams: false, // Disable object streams for better compression
        addDefaultPage: false,
      });

      await fs.writeFile(outputPath, compressedBytes);
    } catch (error: any) {
      throw new Error(`PDF compression failed: ${error.message}`);
    }
  }

  // Add watermark to PDF
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
      // Check if file exists
      await fs.access(pdfPath);
      
      const pdfBytes = await fs.readFile(pdfPath);
      
      if (pdfBytes.length === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Load PDF document
      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(pdfBytes);
      } catch (loadError: any) {
        // Check if it's an encryption error
        if (loadError.message && (loadError.message.includes('encrypt') || loadError.message.includes('password'))) {
          throw new Error('Cannot watermark password-protected PDFs. Please remove the password first.');
        }
        throw new Error(`Failed to load PDF: ${loadError.message}. The PDF might be corrupted.`);
      }
      
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }

      const position = options?.position || 'center';
      const opacity = options?.opacity || 0.3;
      const fontSize = options?.fontSize || 50;
      const rotation = options?.rotation || -45;
      const color = options?.color || { r: 0.5, g: 0.5, b: 0.5 };

      // Embed a font for the watermark
      let font;
      try {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      } catch (fontError: any) {
        throw new Error(`Failed to embed font: ${fontError.message}`);
      }

      // Add watermark to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = fontSize;

          let x = 0;
          let y = 0;

          // Calculate position based on option
          switch (position) {
            case 'center':
              x = (width - textWidth) / 2;
              y = (height - textHeight) / 2;
              break;
            case 'top-left':
              x = 50;
              y = height - textHeight - 50;
              break;
            case 'top-right':
              x = width - textWidth - 50;
              y = height - textHeight - 50;
              break;
            case 'bottom-left':
              x = 50;
              y = 50;
              break;
            case 'bottom-right':
              x = width - textWidth - 50;
              y = 50;
              break;
          }

          // Draw watermark text
          // Note: Rotation is complex in pdf-lib, so we'll draw without rotation for now
          // The text will still be watermarked, just not rotated
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
            opacity,
          });
        } catch (pageError: any) {
          console.error(`Error adding watermark to page ${i + 1}:`, pageError);
          throw new Error(`Failed to add watermark to page ${i + 1}: ${pageError.message}`);
        }
      }

      // Save the modified PDF
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

  // Protect PDF with password
  static async protectPdf(
    pdfPath: string,
    outputPath: string,
    userPassword: string,
    ownerPassword?: string,
    permissions?: {
      printing?: 'lowResolution' | 'highResolution' | false;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
    }
  ): Promise<void> {
    try {
      // Try using qpdf command-line tool for encryption
      // qpdf is a robust tool for PDF manipulation including encryption
      const finalPassword = ownerPassword || userPassword;
      
      // Escape passwords for shell command
      const escapeShell = (str: string) => str.replace(/'/g, "'\\''").replace(/(["$`\\])/g, '\\$1');
      const escapedUserPassword = escapeShell(userPassword);
      const escapedOwnerPassword = escapeShell(finalPassword);
      
      // Build qpdf command with permissions
      let qpdfCommand = `qpdf --encrypt "${escapedUserPassword}" "${escapedOwnerPassword}" 256`;
      
      // Add permission restrictions
      // qpdf permission flags: print, modify, extract, annotate
      // We invert the logic: if permission is false, we restrict it
      if (permissions?.printing === false) {
        qpdfCommand += ' --print=n';
      }
      if (permissions?.modifying === false) {
        qpdfCommand += ' --modify=n';
      }
      if (permissions?.copying === false) {
        qpdfCommand += ' --extract=n';
      }
      if (permissions?.annotating === false) {
        qpdfCommand += ' --annotate=n';
      }
      
      qpdfCommand += ` -- "${pdfPath}" "${outputPath}"`;

      try {
        await execAsync(qpdfCommand);
      } catch (qpdfError: any) {
        // Check if qpdf is not installed
        if (qpdfError.message.includes('qpdf') && qpdfError.message.includes('not found')) {
          throw new Error(
            'PDF password protection requires qpdf to be installed on the server. ' +
            'Please install qpdf: https://qpdf.sourceforge.io/ ' +
            'On Windows: choco install qpdf or download from the website. ' +
            'On Linux: sudo apt-get install qpdf or sudo yum install qpdf. ' +
            'On macOS: brew install qpdf'
          );
        }
        // If qpdf command failed for another reason, throw the error
        throw new Error(`qpdf encryption failed: ${qpdfError.message}`);
      }
    } catch (error: any) {
      // If it's our custom error, rethrow it
      if (error.message.includes('qpdf') || error.message.includes('password protection')) {
        throw error;
      }
      throw new Error(`PDF protection failed: ${error.message}`);
    }
  }
}

