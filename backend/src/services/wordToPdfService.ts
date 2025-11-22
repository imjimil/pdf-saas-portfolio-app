import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

export class WordToPdfService {
  static async convert(wordPath: string, outputPath: string, originalFileName?: string): Promise<void> {
    try {
      console.log('Starting Word to PDF conversion:', { wordPath, outputPath, originalFileName });
      
      const wordBuffer = await fs.readFile(wordPath);
      
      // Check file extension from original filename if provided, otherwise from path
      const fileNameToCheck = originalFileName || wordPath;
      const fileExtension = path.extname(fileNameToCheck).toLowerCase();
      
      console.log('File extension:', fileExtension);
      
      // Check if file is actually a DOCX by checking ZIP signature (DOCX files are ZIP archives)
      const isZipFile = wordBuffer[0] === 0x50 && wordBuffer[1] === 0x4B;
      console.log('Is ZIP file (DOCX signature):', isZipFile);
      
      // Mammoth only supports .docx files, not .doc files
      if (fileExtension === '.doc') {
        throw new Error('Legacy .doc format is not supported. Please convert your file to .docx format first, or use an online converter.');
      }
      
      if (fileExtension !== '.docx' && !isZipFile) {
        throw new Error('Unsupported file format. Only .docx files are supported. The file may be corrupted or in an unsupported format.');
      }
      
      if (!isZipFile) {
        throw new Error('Invalid DOCX file. The file does not appear to be a valid Word document.');
      }
      
      // Convert DOCX to HTML using mammoth
      let result;
      try {
        result = await mammoth.convertToHtml({ buffer: wordBuffer });
      } catch (mammothError: any) {
        console.error('Mammoth conversion error:', mammothError);
        throw new Error(`Failed to read Word document. The file may be corrupted or in an unsupported format: ${mammothError.message}`);
      }
      
      const html = result.value;
      const messages = result.messages;
      
      // Log any conversion warnings
      if (messages.length > 0) {
        console.log('Word to PDF conversion messages:', messages);
      }
      
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      let currentPage = pdfDoc.addPage([612, 792]); // A4 size
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const helveticaBoldObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
      
      // Parse HTML and render with formatting
      const maxWidth = 512; // Page width minus margins (612 - 100)
      const margin = 50;
      const marginBottom = 50;
      let y = 742; // Start from top with margin
      const lineHeight = 14.4; // 12pt * 1.2
      const paragraphSpacing = 6;
      
      // Enhanced HTML parser to extract formatted text with proper structure
      const parseHTML = (htmlContent: string): Array<{ text: string; bold?: boolean; italic?: boolean; size?: number; isHeading?: boolean; isListItem?: boolean }> => {
        const elements: Array<{ text: string; bold?: boolean; italic?: boolean; size?: number; isHeading?: boolean; isListItem?: boolean }> = [];
        
        // Remove style and script tags
        let cleanHtml = htmlContent
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Process headings first
        const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
        let headingMatch;
        const headingPositions: Array<{ start: number; end: number; level: number; text: string }> = [];
        
        while ((headingMatch = headingRegex.exec(cleanHtml)) !== null) {
          const level = parseInt(headingMatch[1]);
          const text = headingMatch[2].replace(/<[^>]*>/g, '').trim();
          if (text) {
            headingPositions.push({
              start: headingMatch.index,
              end: headingMatch.index + headingMatch[0].length,
              level,
              text
            });
          }
        }
        
        // Process lists
        const listRegex = /<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi;
        let listMatch;
        const listPositions: Array<{ start: number; end: number; items: string[] }> = [];
        
        while ((listMatch = listRegex.exec(cleanHtml)) !== null) {
          const listContent = listMatch[1];
          const items = listContent.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
          const itemTexts = items.map(item => item.replace(/<[^>]*>/g, '').trim()).filter(t => t);
          if (itemTexts.length > 0) {
            listPositions.push({
              start: listMatch.index,
              end: listMatch.index + listMatch[0].length,
              items: itemTexts
            });
          }
        }
        
        // Process paragraphs
        const paraRegex = /<p[^>]*>(.*?)<\/p>/gi;
        let paraMatch;
        const paragraphs: string[] = [];
        
        while ((paraMatch = paraRegex.exec(cleanHtml)) !== null) {
          paragraphs.push(paraMatch[1]);
        }
        
        // If no paragraphs found, try to extract any text content
        if (paragraphs.length === 0 && headingPositions.length === 0 && listPositions.length === 0) {
          // Extract all text content
          const allText = cleanHtml
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#160;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (allText) {
            elements.push({ text: allText, size: 12 });
          }
          return elements;
        }
        
        // Process headings
        headingPositions.forEach(({ level, text }) => {
          const fontSize = Math.max(14, 24 - (level * 2));
          elements.push({ text, bold: true, size: fontSize, isHeading: true });
          elements.push({ text: '\n', size: fontSize });
        });
        
        // Process lists
        listPositions.forEach(({ items }) => {
          items.forEach(item => {
            // Process inline formatting in list items
            processInlineText(item, elements, 12, true);
            elements.push({ text: '\n', size: 12 });
          });
        });
        
        // Process paragraphs
        paragraphs.forEach(para => {
          processInlineText(para, elements, 12, false);
          elements.push({ text: '\n', size: 12 });
        });
        
        return elements;
      };
      
      // Simplified inline text processing with better error handling
      const processInlineText = (
        content: string,
        elements: Array<{ text: string; bold?: boolean; italic?: boolean; size?: number; isHeading?: boolean; isListItem?: boolean }>,
        fontSize: number,
        isListItem: boolean
      ): void => {
        try {
          // Decode HTML entities first
          content = content
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#160;/g, ' ');
          
          // Simple approach: extract text with formatting markers
          let text = content;
          const parts: Array<{ text: string; bold: boolean; italic: boolean }> = [];
          let currentIndex = 0;
          
          // Find all bold and italic tags
          const boldRegex = /<(strong|b)[^>]*>(.*?)<\/\1>/gi;
          const italicRegex = /<(em|i)[^>]*>(.*?)<\/\1>/gi;
          
          // Collect all formatting positions
          const positions: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'bolditalic'; text: string }> = [];
          
          let match;
          while ((match = boldRegex.exec(text)) !== null) {
            positions.push({
              start: match.index,
              end: match.index + match[0].length,
              type: 'bold',
              text: match[2]
            });
          }
          
          while ((match = italicRegex.exec(text)) !== null) {
            positions.push({
              start: match.index,
              end: match.index + match[0].length,
              type: 'italic',
              text: match[2]
            });
          }
          
          // Sort by position
          positions.sort((a, b) => a.start - b.start);
          
          // Extract text segments
          let lastPos = 0;
          for (const pos of positions) {
            // Add text before this formatting
            if (pos.start > lastPos) {
              const beforeText = text.substring(lastPos, pos.start).replace(/<[^>]*>/g, '').trim();
              if (beforeText) {
                parts.push({ text: beforeText, bold: false, italic: false });
              }
            }
            
            // Add formatted text
            const formattedText = pos.text.replace(/<[^>]*>/g, '').trim();
            if (formattedText) {
              parts.push({
                text: formattedText,
                bold: pos.type === 'bold' || pos.type === 'bolditalic',
                italic: pos.type === 'italic' || pos.type === 'bolditalic'
              });
            }
            
            lastPos = pos.end;
          }
          
          // Add remaining text
          if (lastPos < text.length) {
            const remaining = text.substring(lastPos).replace(/<[^>]*>/g, '').trim();
            if (remaining) {
              parts.push({ text: remaining, bold: false, italic: false });
            }
          }
          
          // If no formatting found, just extract plain text
          if (parts.length === 0) {
            const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (plainText) {
              parts.push({ text: plainText, bold: false, italic: false });
            }
          }
          
          // Add parts to elements
          parts.forEach((part, index) => {
            if (part.text) {
              elements.push({
                text: (isListItem && index === 0 ? '• ' : '') + part.text,
                bold: part.bold,
                italic: part.italic,
                size: fontSize,
                isListItem: isListItem && index === 0
              });
            }
          });
        } catch (error: any) {
          // Fallback: just extract plain text
          console.error('Error processing inline text:', error);
          const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          if (plainText) {
            elements.push({ text: (isListItem ? '• ' : '') + plainText, size: fontSize, isListItem });
          }
        }
      };
      
      const elements = parseHTML(html);
      
      if (elements.length === 0) {
        throw new Error('No text content found in Word document');
      }
      
      // Render elements with formatting
      for (const element of elements) {
        if (element.text === '\n') {
          y -= lineHeight + paragraphSpacing;
          if (y < marginBottom) {
            currentPage = pdfDoc.addPage([612, 792]);
            y = 742;
          }
          continue;
        }
        
        const fontSize = element.size || 12;
        const font = element.bold && element.italic
          ? helveticaBoldObliqueFont
          : element.bold
          ? helveticaBoldFont
          : element.italic
          ? helveticaObliqueFont
          : helveticaFont;
        
        // Word wrap text
        const words = element.text.split(' ');
        let currentLine = '';
        let x = margin;
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth && currentLine) {
            // Draw current line
            currentPage.drawText(currentLine, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
            
            y -= lineHeight;
            currentLine = word;
            
            // Check if we need a new page
            if (y < marginBottom) {
              currentPage = pdfDoc.addPage([612, 792]);
              y = 742;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        // Draw remaining line
        if (currentLine) {
          currentPage.drawText(currentLine, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          
          y -= lineHeight + (element.isHeading ? paragraphSpacing * 2 : 0);
          
          if (y < marginBottom) {
            currentPage = pdfDoc.addPage([612, 792]);
            y = 742;
          }
        }
      }
      
      // Save PDF
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);
    } catch (error: any) {
      throw new Error(`Word to PDF conversion failed: ${error.message}`);
    }
  }
}

