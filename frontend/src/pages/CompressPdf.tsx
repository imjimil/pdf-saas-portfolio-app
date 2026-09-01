import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone, formatBytes } from '../components/Dropzone';
import { RadioCards, type RadioCardOption } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('compress-pdf')!;

type Level = 'light' | 'balanced' | 'strong' | 'extreme';

const LEVELS: ReadonlyArray<RadioCardOption<Level>> = [
  {
    value: 'light',
    title: 'Light',
    description: 'Best quality, smallest saving. Good for print.',
  },
  {
    value: 'balanced',
    title: 'Balanced',
    description: 'A clear size drop that still looks sharp on screen.',
  },
  {
    value: 'strong',
    title: 'Strong',
    description: 'Much smaller. Images soften a little.',
  },
  {
    value: 'extreme',
    title: 'Extreme',
    description: 'Smallest file, visible quality loss.',
  },
];

export default function CompressPdf() {
  const [files, setFiles] = usePendingFiles();
  const [level, setLevel] = useState<Level>('balanced');
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const alreadyOptimized =
    result?.meta.alreadyOptimized === true || result?.meta.alreadyOptimized === 'true';
  const savedPercent = result ? Number(result.meta.savedPercent) : 0;
  const originalSize = result ? Number(result.meta.originalSize) : 0;
  const compressedSize = result ? Number(result.meta.compressedSize) : 0;

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Compress PDF',
          onClick: () => run({ endpoint: '/pdf/compress', files, fields: { level } }),
          disabled: !files.length,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: alreadyOptimized ? 'Nothing left to squeeze' : 'Compression complete',
                detail: alreadyOptimized
                  ? 'This PDF was already well optimised, so we kept the original.'
                  : `Reduced by ${savedPercent}% — ${formatBytes(originalSize)} to ${formatBytes(compressedSize)}.`,
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
        <Dropzone accept={tool.accept} files={files} onChange={setFiles} />

        <div className="card space-y-4 p-4 sm:p-5">
          <RadioCards
            label="How much should we compress?"
            value={level}
            onChange={setLevel}
            options={LEVELS}
            columns={2}
            helper="Text stays crisp at every level; only images are re-encoded."
          />
        </div>
      </ToolShell>
    </AppShell>
  );
}
