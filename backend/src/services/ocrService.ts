import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { ocrSpace, OcrSpaceResponse } from 'ocr-space-api-wrapper';

export class OCRService {
  /**
   * Create a searchable PDF using OCR.space API
   * Returns the URL to download the searchable PDF
   */
  static async createSearchablePdf(pdfPath: string): Promise<{ searchablePdfUrl: string; text: string }> {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new Error('OCR_SPACE_API_KEY environment variable is not set. Please set it to use OCR functionality.');
    }

    console.log('Creating searchable PDF with OCR.space API...');
    const result = await ocrSpace(pdfPath, {
      apiKey: apiKey,
      language: 'eng',
      isOverlayRequired: false,
      isCreateSearchablePdf: true,
      isSearchablePdfHideTextLayer: false,
    }) as OcrSpaceResponse;

    console.log('OCR.space API response received');

    // Parse the response
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from OCR.space API');
    }

    // Check for errors in response
    if (result.OCRExitCode !== 1) {
      const errorMessage = result.ErrorMessage?.[0] || 'Unknown OCR error';
      console.error('OCR.space API error:', errorMessage);
      throw new Error(`OCR.space API error: ${errorMessage}`);
    }

    // Extract text from all pages
    let fullText = '';
    if (result.ParsedResults && Array.isArray(result.ParsedResults)) {
      for (let i = 0; i < result.ParsedResults.length; i++) {
        const pageResult = result.ParsedResults[i];
        if (pageResult.ParsedText) {
          fullText += pageResult.ParsedText.trim() + '\n\n';
        }
      }
    }

    const searchablePdfUrl = result.SearchablePDFURL;
    if (!searchablePdfUrl) {
      throw new Error('OCR.space API did not return a searchable PDF URL');
    }

    console.log('Searchable PDF created. URL:', searchablePdfUrl);
    return {
      searchablePdfUrl,
      text: fullText.trim(),
    };
  }

  /**
   * Extract text from PDF using OCR.space API
   * First tries direct text extraction, then falls back to OCR.space API
   */
  static async extractTextFromPdf(pdfPath: string): Promise<string> {
    try {
      console.log('Starting text extraction for:', pdfPath);
      
      // FIRST: Try direct text extraction (for PDFs with embedded text)
      // This is faster and more reliable for most PDFs
      try {
        console.log('Attempting direct text extraction...');
        const dataBuffer = await fs.readFile(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        const directText = pdfData.text || '';
        console.log('Direct text extraction length:', directText.length, 'characters');
        
        // If we got substantial text (> 50 characters), use it
        // This handles most normal PDFs with embedded text
        if (directText.trim().length > 50) {
          console.log('Using direct text extraction (PDF has embedded text)');
          return directText.trim();
        }
        
        // If we got some text but not much, still use it (might be a short document)
        if (directText.trim().length > 0) {
          console.log('Using direct text extraction (short document)');
          return directText.trim();
        }
        
        console.log('Direct extraction returned empty or very little text, trying OCR.space API...');
      } catch (directError: any) {
        console.warn('Direct text extraction failed:', directError.message);
        console.log('Falling back to OCR.space API...');
      }
      
      // SECOND: If direct extraction failed or returned empty, try OCR.space API
      // This is for scanned PDFs or PDFs with only images
      
      const apiKey = process.env.OCR_SPACE_API_KEY;
      if (!apiKey) {
        console.warn('OCR_SPACE_API_KEY not set - cannot use OCR.space API');
        // Try direct extraction one more time
        try {
          const dataBuffer = await fs.readFile(pdfPath);
          const pdfData = await pdfParse(dataBuffer);
          const fallbackText = pdfData.text || '';
          if (fallbackText.trim().length > 0) {
            console.log('Using direct extraction as fallback (no API key)');
            return fallbackText.trim();
          }
        } catch (e) {
          // Ignore
        }
        throw new Error('OCR_SPACE_API_KEY environment variable is not set. Please set it to use OCR functionality.');
      }
      
      console.log('Calling OCR.space API...');
      const result = await ocrSpace(pdfPath, {
        apiKey: apiKey,
        language: 'eng',
        isOverlayRequired: false,
      }) as OcrSpaceResponse;
      
      console.log('OCR.space API response received');
      
      // Parse the response
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from OCR.space API');
      }
      
      // Check for errors in response
      if (result.OCRExitCode !== 1) {
        const errorMessage = result.ErrorMessage?.[0] || 'Unknown OCR error';
        console.error('OCR.space API error:', errorMessage);
        throw new Error(`OCR.space API error: ${errorMessage}`);
      }
      
      // Extract text from all pages
      let fullText = '';
      
      if (result.ParsedResults && Array.isArray(result.ParsedResults)) {
        for (let i = 0; i < result.ParsedResults.length; i++) {
          const pageResult = result.ParsedResults[i];
          if (pageResult.ParsedText) {
            fullText += pageResult.ParsedText.trim() + '\n\n';
          }
        }
      }
      
      const ocrText = fullText.trim();
      console.log('OCR.space extraction complete. Total text length:', ocrText.length);
      
      // Return OCR text if available
      if (ocrText.length > 0) {
        return ocrText;
      } else {
        // Final attempt with direct extraction
        try {
          const dataBuffer = await fs.readFile(pdfPath);
          const pdfData = await pdfParse(dataBuffer);
          const finalText = pdfData.text || '';
          if (finalText.trim().length > 0) {
            console.log('Using direct extraction after OCR returned empty');
            return finalText.trim();
          }
        } catch (e) {
          // Ignore
        }
        throw new Error('OCR extraction returned no text. The PDF might be corrupted, password-protected, or contain only images without readable text.');
      }
    } catch (error: any) {
      console.error('Text extraction error:', error);
      
      // Final fallback to text extraction
      try {
        console.log('Attempting final fallback text extraction...');
        const dataBuffer = await fs.readFile(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        const fallbackText = pdfData.text || '';
        
        if (fallbackText.trim().length > 0) {
          console.log('Fallback text extraction successful:', fallbackText.length, 'characters');
          return fallbackText.trim();
        } else {
          throw new Error(`Text extraction failed: ${error.message}. The PDF appears to have no extractable text.`);
        }
      } catch (fallbackError: any) {
        // If fallback also fails, provide a helpful error message
        const errorMsg = error.message || 'Unknown error';
        const fallbackMsg = fallbackError.message || 'Unknown fallback error';
        throw new Error(`Text extraction failed: ${errorMsg}. Fallback also failed: ${fallbackMsg}`);
      }
    }
  }

  /**
   * Process PDF with OCR and save to file
   */
  static async processPdfWithOcr(pdfPath: string, outputPath: string): Promise<void> {
    try {
      console.log('Processing PDF with OCR:', pdfPath);
      const text = await this.extractTextFromPdf(pdfPath);
      
      if (!text || text.trim().length === 0) {
        throw new Error('OCR extraction returned empty text');
      }
      
      console.log('Writing OCR result to file:', outputPath, 'Text length:', text.length);
      await fs.writeFile(outputPath, text, 'utf-8');
      
      // Verify file was written
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Output file was created but is empty');
      }
      
      console.log('OCR processing complete. Output file size:', stats.size, 'bytes');
    } catch (error: any) {
      console.error('OCR processing error:', error);
      
      // Final fallback: try to extract text without OCR
      try {
        console.log('Attempting final fallback text extraction...');
        const dataBuffer = await fs.readFile(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        const extractedText = pdfData.text || 'No text could be extracted from this PDF. This might be a scanned document that requires OCR processing, or the PDF might be corrupted or password-protected.';
        
        await fs.writeFile(outputPath, extractedText, 'utf-8');
        console.log('Fallback text extraction written. Length:', extractedText.length);
      } catch (fallbackError: any) {
        console.error('Final fallback also failed:', fallbackError);
        throw new Error(`OCR processing failed: ${error.message}. Fallback error: ${fallbackError.message}`);
      }
    }
  }
}
