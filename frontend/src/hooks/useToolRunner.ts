import { useCallback, useState } from 'react';
import { pdfAPI, downloadBlob, ApiError, FileResult } from '../services/api';
import { toast } from '../components/ui/Toast';
import { useUsageTracking } from './useUsageTracking';

/**
 * Runs a tool request and owns the shared screen state: progress, errors, and
 * the finished file. Every tool page uses this instead of repeating the same
 * loading/error/download bookkeeping.
 */

export interface ToolError {
  message: string;
  hint?: string;
}

export interface RunOptions {
  endpoint: string;
  files: File[];
  fields?: Record<string, unknown>;
  /** Send as a `files[]` field even when only one file is selected. */
  multiple?: boolean;
  /** Overrides the filename the server suggested. */
  downloadName?: string;
}

export function useToolRunner() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<ToolError | null>(null);
  const [result, setResult] = useState<FileResult | null>(null);
  const { incrementUsage } = useUsageTracking();

  const run = useCallback(
    async ({ endpoint, files, fields, multiple, downloadName }: RunOptions) => {
      if (!files.length) {
        setError({ message: 'Choose a file first.' });
        return;
      }

      setRunning(true);
      setError(null);
      setProgress(0);

      try {
        const output = await pdfAPI.run(
          endpoint,
          multiple ? files : files[0],
          fields,
          setProgress
        );

        setResult(downloadName ? { ...output, fileName: downloadName } : output);
        incrementUsage();
        toast.success('Done', 'Your file is ready to download.');
      } catch (caught) {
        const apiError =
          caught instanceof ApiError
            ? caught
            : new ApiError('Something went wrong. Please try again.');

        setError({ message: apiError.message, hint: apiError.hint });
        toast.error(apiError.message, apiError.hint);
      } finally {
        setRunning(false);
        setProgress(null);
      }
    },
    [incrementUsage]
  );

  const download = useCallback(() => {
    if (result) downloadBlob(result.blob, result.fileName);
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return { run, download, reset, running, progress, error, result, setError };
}
