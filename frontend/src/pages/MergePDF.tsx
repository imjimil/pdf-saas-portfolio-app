import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('merge-pdf')!;

export default function MergePDF() {
  const [files, setFiles] = usePendingFiles();
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const enoughFiles = files.length >= 2;
  const documents = result ? Number(result.meta.documents) : 0;
  const pages = result ? Number(result.meta.pages) : 0;

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: enoughFiles ? `Merge ${files.length} PDFs` : 'Merge PDFs',
          onClick: () => run({ endpoint: '/pdf/merge', files, multiple: true }),
          disabled: !enoughFiles,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Your merged PDF is ready',
                detail:
                  documents && pages
                    ? `Combined ${documents} documents into ${pages} pages.`
                    : 'Your PDFs were joined in the order you set.',
                downloadLabel: 'Download merged PDF',
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
          hint="Up to 20 PDFs, 50 MB each"
        />

        <div className="card p-4 sm:p-5">
          <p className="text-[13.5px] text-ink-soft dark:text-sand-200">
            {enoughFiles
              ? 'Pages appear in the order shown above. Drag a file to move it.'
              : 'Add at least two PDFs'}
          </p>
          {!enoughFiles && (
            <p className="mt-1 text-[12.5px] text-muted">
              {files.length === 1
                ? 'One more file and you are ready to merge.'
                : 'Choose the files you want to join, then arrange them in order.'}
            </p>
          )}
        </div>
      </ToolShell>
    </AppShell>
  );
}
