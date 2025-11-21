import { PDFDocument } from 'pdf-lib';
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
}

