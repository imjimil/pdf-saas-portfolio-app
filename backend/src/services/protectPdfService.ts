import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ProtectPdfService {
  static async protect(
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

