import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('word-to-pdf')!;

export default function WordToPdf() {
  const [files, setFiles] = usePendingFiles();
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Convert to PDF',
          onClick: () => run({ endpoint: '/pdf/word-to-pdf', files }),
          disabled: !files.length,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Your PDF is ready',
                detail:
                  result.meta.fidelity === 'basic'
                    ? 'Text and structure were preserved; fine formatting may differ slightly.'
                    : 'Fonts, spacing and page breaks match the original document.',
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
          hint="DOCX, DOC, ODT or RTF up to 50 MB"
        />
      </ToolShell>
    </AppShell>
  );
}
