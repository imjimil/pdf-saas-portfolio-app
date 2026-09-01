import { Info } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('pdf-to-word')!;

export default function PdfToWord() {
  const [files, setFiles] = usePendingFiles();
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const basicFidelity = result?.meta.fidelity === 'basic';

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Convert to Word',
          onClick: () => run({ endpoint: '/pdf/to-word', files }),
          disabled: !files.length,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Your Word document is ready',
                detail: 'Open it in Word, Pages or Google Docs to keep editing.',
                downloadLabel: 'Download Word file',
                onDownload: download,
                onReset: () => {
                  reset();
                  setFiles([]);
                },
                extra: basicFidelity ? (
                  <p className="mx-auto mt-4 flex max-w-sm items-start gap-2 rounded-xl bg-sand-100 p-3 text-left text-[13px] text-ink-soft dark:bg-white/[0.05] dark:text-sand-300">
                    <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
                    This server produced a simpler conversion, so complex layouts may need
                    tidying up.
                  </p>
                ) : undefined,
              }
            : null
        }
      >
        <Dropzone accept={tool.accept} files={files} onChange={setFiles} />
        <p className="mx-auto mt-4 flex max-w-md items-start gap-2 text-[13px] text-muted text-pretty">
          <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
          Converts selectable text into an editable Word file. Scanned PDFs need OCR first;
          complex layouts may need tidying after conversion.
        </p>
      </ToolShell>
    </AppShell>
  );
}
