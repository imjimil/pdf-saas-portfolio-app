import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { NumberField, SegmentedControl, TextField } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('split-pdf')!;

type Mode = 'ranges' | 'all' | 'every-n';

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'ranges', label: 'Page ranges' },
  { value: 'all', label: 'Every page' },
  { value: 'every-n', label: 'Fixed size' },
];

export default function SplitPDF() {
  const [files, setFiles] = usePendingFiles();
  const [mode, setMode] = useState<Mode>('ranges');
  const [pageRanges, setPageRanges] = useState('');
  const [chunkSize, setChunkSize] = useState('2');
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const parsedChunk = Number(chunkSize);
  const chunkValid = Number.isInteger(parsedChunk) && parsedChunk >= 1;

  const ready =
    files.length > 0 &&
    (mode === 'ranges' ? pageRanges.trim().length > 0 : mode === 'all' || chunkValid);

  const documents = result ? Number(result.meta.documents) : 0;
  const pages = result ? Number(result.meta.pages) : 0;
  const isArchive = result?.meta.archive === true || result?.meta.archive === 'true';

  const resultDetail = () => {
    const parts: string[] = [];
    if (documents && pages) {
      parts.push(
        `${pages} ${pages === 1 ? 'page' : 'pages'} split into ${documents} ${
          documents === 1 ? 'document' : 'documents'
        }.`
      );
    }
    if (isArchive) parts.push('They are bundled in a ZIP file.');
    return parts.join(' ') || 'Your pages have been split.';
  };

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Split PDF',
          onClick: () =>
            run({
              endpoint: '/pdf/split',
              files,
              fields: {
                mode,
                pageRanges: mode === 'ranges' ? pageRanges.trim() : undefined,
                chunkSize: mode === 'every-n' ? parsedChunk : undefined,
              },
            }),
          disabled: !ready,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Split complete',
                detail: resultDetail(),
                downloadLabel: isArchive ? 'Download ZIP' : 'Download PDF',
                onDownload: download,
                onReset: () => {
                  reset();
                  setFiles([]);
                },
              }
            : null
        }
      >
        <Dropzone accept={tool.accept} files={files} onChange={setFiles} />

        <div className="card space-y-4 p-4 sm:p-5">
          <SegmentedControl
            label="How should we split it?"
            value={mode}
            onChange={setMode}
            options={MODES}
          />

          {mode === 'ranges' && (
            <TextField
              label="Pages to keep"
              value={pageRanges}
              onChange={setPageRanges}
              placeholder="e.g. 1-3, 7, 10-12"
              helper="Separate ranges with commas. Each range becomes its own PDF."
              autoComplete="off"
              inputMode="numeric"
            />
          )}

          {mode === 'all' && (
            <p className="text-[13.5px] text-ink-soft dark:text-sand-200">
              Every page becomes its own PDF, and you get them all back in one ZIP file.
            </p>
          )}

          {mode === 'every-n' && (
            <NumberField
              label="Pages per file"
              value={chunkSize}
              onChange={setChunkSize}
              min={1}
              step={1}
              helper="The PDF is cut into equal parts of this many pages, returned as a ZIP."
              error={chunkValid ? undefined : 'Enter a whole number of 1 or more.'}
            />
          )}
        </div>
      </ToolShell>
    </AppShell>
  );
}
