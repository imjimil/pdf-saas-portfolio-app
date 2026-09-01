import { useState } from 'react';
import { ClipboardCopy, Download, FileSearch, RotateCcw, Type } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { SegmentedControl, type SegmentOption } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { ApiError, downloadBlob, pdfAPI } from '../services/api';
import { useToolRunner, type ToolError } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('pdf-ocr')!;

const LANGUAGE = 'eng';

type Mode = 'text' | 'searchable';

const MODES: ReadonlyArray<SegmentOption<Mode>> = [
  { value: 'text', label: 'Extract text', icon: Type },
  { value: 'searchable', label: 'Searchable PDF', icon: FileSearch },
];

interface Extraction {
  text: string;
  fileName: string;
  wordCount: number;
  characterCount: number;
}

export default function PdfOcr() {
  const [files, setFiles] = usePendingFiles();
  const [mode, setMode] = useState<Mode>('text');

  // Text mode returns JSON rather than a file, so it keeps its own state instead
  // of being forced through the runner's file-result shape.
  const [extracting, setExtracting] = useState(false);
  const [textProgress, setTextProgress] = useState<number | null>(null);
  const [textError, setTextError] = useState<ToolError | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);

  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const clearTextState = () => {
    setExtraction(null);
    setTextError(null);
    setTextProgress(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearTextState();
    reset();
  };

  const extractText = async () => {
    if (!files.length) return;

    setExtracting(true);
    setTextError(null);
    setExtraction(null);
    setTextProgress(0);

    try {
      const response = await pdfAPI.ocrText(files[0], { language: LANGUAGE }, setTextProgress);
      setExtraction({
        text: response.text,
        fileName: response.fileName,
        wordCount: response.wordCount,
        characterCount: response.characterCount,
      });
      toast.success('Text recognised', `${response.wordCount.toLocaleString()} words found.`);
    } catch (caught) {
      const apiError =
        caught instanceof ApiError
          ? caught
          : new ApiError('Could not read text from this file.');
      setTextError({ message: apiError.message, hint: apiError.hint });
      toast.error(apiError.message, apiError.hint);
    } finally {
      setExtracting(false);
      setTextProgress(null);
    }
  };

  const copyText = async () => {
    if (!extraction) return;
    try {
      await navigator.clipboard.writeText(extraction.text);
      toast.success('Copied', 'The text is on your clipboard.');
    } catch {
      toast.error('Could not copy', 'Select the text and copy it manually.');
    }
  };

  const downloadText = () => {
    if (!extraction) return;
    downloadBlob(
      new Blob([extraction.text], { type: 'text/plain;charset=utf-8' }),
      extraction.fileName
    );
  };

  const textMode = mode === 'text';

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: textMode ? 'Read the text' : 'Create searchable PDF',
          onClick: textMode
            ? extractText
            : () =>
                run({
                  endpoint: '/pdf/ocr',
                  files,
                  fields: { createSearchablePdf: true, language: LANGUAGE },
                }),
          disabled: !files.length,
          loading: textMode ? extracting : running,
        }}
        progress={textMode ? textProgress : progress}
        error={textMode ? textError : error}
        result={
          !textMode && result
            ? {
                title: 'Your searchable PDF is ready',
                detail: 'The pages look the same, but the text is now selectable.',
                downloadLabel: 'Download PDF',
                onDownload: download,
                onReset: () => {
                  reset();
                  setFiles([]);
                },
              }
            : null
        }
      >
        <Dropzone
          accept={tool.accept}
          files={files}
          onChange={(next) => {
            setFiles(next);
            clearTextState();
          }}
        />

        <div className="card space-y-3 p-4 sm:p-5">
          <SegmentedControl
            label="What do you need?"
            value={mode}
            onChange={switchMode}
            options={MODES}
          />
          <p className="text-[12.5px] text-muted text-pretty">
            {textMode
              ? 'Extract text reads the words off the page and shows them here so you can copy or save them.'
              : 'Searchable PDF keeps your original pages and adds an invisible text layer you can search and select.'}
          </p>
        </div>

        {extraction && (
          <div className="card space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-[15px] font-semibold">Recognised text</h2>
              <p className="text-[12.5px] text-muted">
                {extraction.wordCount.toLocaleString()} words ·{' '}
                {extraction.characterCount.toLocaleString()} characters
              </p>
            </div>

            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border hairline bg-sand-50 p-3.5 text-[13px] leading-relaxed text-ink-soft dark:bg-white/[0.03] dark:text-sand-200">
              {extraction.text || 'No text was found on these pages.'}
            </pre>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" icon={ClipboardCopy} onClick={copyText}>
                Copy text
              </Button>
              <Button variant="secondary" icon={Download} onClick={downloadText}>
                Download .txt
              </Button>
              <Button
                variant="ghost"
                icon={RotateCcw}
                onClick={() => {
                  clearTextState();
                  setFiles([]);
                }}
              >
                Start over
              </Button>
            </div>
          </div>
        )}
      </ToolShell>
    </AppShell>
  );
}
