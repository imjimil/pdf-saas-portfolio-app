import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export const validateFile = (options: FileValidationOptions = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'],
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    const files = (req as any).files;

    // Handle single file
    if (file) {
      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        return next(
          new CustomError(
            `File size exceeds the maximum limit of ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
            400
          )
        );
      }

      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return next(
          new CustomError(
            `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
            400
          )
        );
      }

      // Check file extension
      const fileExtension = file.originalname
        .substring(file.originalname.lastIndexOf('.'))
        .toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return next(
          new CustomError(
            `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
            400
          )
        );
      }
    }

    // Handle multiple files
    if (files && Array.isArray(files)) {
      for (const f of files) {
        // Check file size
        if (f.size > maxSize) {
          const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
          return next(
            new CustomError(
              `File "${f.originalname}" exceeds the maximum limit of ${maxSizeMB}MB.`,
              400
            )
          );
        }

        // Check MIME type
        if (!allowedMimeTypes.includes(f.mimetype)) {
          return next(
            new CustomError(
              `Invalid file type for "${f.originalname}". Allowed types: ${allowedExtensions.join(', ')}`,
              400
            )
          );
        }
      }
    }

    next();
  };
};

