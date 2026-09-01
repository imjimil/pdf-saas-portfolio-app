import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { Toggle } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('pdf-to-text')!;

export default function PdfToText() {
  const [files, setFiles] = usePendingFiles();
  const [layout, setLayout] = useState(true);
  const [pageMarkers, setPageMarkers] = useState(false);
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const words = result ? Number(result.meta.words) : 0;
  const characters = result ? Number(result.meta.characters) : 0;

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Extract text',
          onClick: () =>
            run({ endpoint: '/pdf/to-txt', files, fields: { layout, pageMarkers } }),
          disabled: !files.length,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Text extracted',
                detail: words
                  ? `${words.toLocaleString()} words and ${characters.toLocaleString()} characters, saved as a plain .txt file.`
                  : 'Saved as a plain .txt file.',
                downloadLabel: 'Download .txt file',
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
          <Toggle
            label="Keep original layout"
            description="Preserves columns and indentation as they appear on the page."
            checked={layout}
            onChange={setLayout}
          />
          <hr className="border-t hairline" />
          <Toggle
            label="Mark page breaks"
            description="Adds a short marker where each new page begins."
            checked={pageMarkers}
            onChange={setPageMarkers}
          />
        </div>

        <p className="px-1 text-[12.5px] text-muted">
          Scanned PDFs hold pictures of text rather than text itself. For those, use PDF OCR.
        </p>
      </ToolShell>
    </AppShell>
  );
}
