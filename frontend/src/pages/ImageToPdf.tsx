import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { SelectField } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('image-to-pdf')!;

type PageSize = 'auto' | 'a4' | 'letter';
type Orientation = 'auto' | 'portrait' | 'landscape';

const PAGE_SIZES = [
  { value: 'auto', label: 'Match each image' },
  { value: 'a4', label: 'A4 (210 x 297 mm)' },
  { value: 'letter', label: 'Letter (8.5 x 11 in)' },
] as const satisfies ReadonlyArray<{ value: PageSize; label: string }>;

const ORIENTATIONS = [
  { value: 'auto', label: 'Match each image' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
] as const satisfies ReadonlyArray<{ value: Orientation; label: string }>;

export default function ImageToPdf() {
  const [files, setFiles] = usePendingFiles();
  const [pageSize, setPageSize] = useState<PageSize>('auto');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const pages = result ? Number(result.meta.pages) : 0;

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: files.length > 1 ? `Create PDF from ${files.length} images` : 'Create PDF',
          onClick: () =>
            run({
              endpoint: '/pdf/image-to-pdf',
              files,
              multiple: true,
              fields: { pageSize, orientation },
            }),
          disabled: !files.length,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Your PDF is ready',
                detail: pages
                  ? `Placed your images across ${pages} ${pages === 1 ? 'page' : 'pages'}.`
                  : 'Your images were combined into a single PDF.',
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
          onChange={setFiles}
          multiple
          reorderable
          hint="JPG, PNG, WEBP, HEIC or TIFF up to 50 MB each"
        />

        <div className="card space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Page size"
              value={pageSize}
              onChange={setPageSize}
              options={PAGE_SIZES}
            />
            <SelectField
              label="Orientation"
              value={orientation}
              onChange={setOrientation}
              options={ORIENTATIONS}
            />
          </div>
          <p className="text-[12.5px] text-muted">
            Pages follow the order above. Drag an image to move it.
          </p>
        </div>
      </ToolShell>
    </AppShell>
  );
}
