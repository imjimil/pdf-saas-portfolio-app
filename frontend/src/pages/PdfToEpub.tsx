import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { TextField } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('pdf-to-epub')!;

export default function PdfToEpub() {
  const [files, setFiles] = usePendingFiles();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const chapters = result ? Number(result.meta.chapters) : 0;

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Convert to EPUB',
          onClick: () =>
            run({
              endpoint: '/pdf/to-epub',
              files,
              fields: { title: title.trim(), author: author.trim() },
            }),
          disabled: !files.length,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Your e-book is ready',
                detail: chapters
                  ? `Split into ${chapters} ${chapters === 1 ? 'chapter' : 'chapters'} that reflow to fit any screen.`
                  : 'The text reflows to fit any screen size.',
                downloadLabel: 'Download EPUB',
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
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="Optional"
              maxLength={200}
              autoComplete="off"
            />
            <TextField
              label="Author"
              value={author}
              onChange={setAuthor}
              placeholder="Optional"
              maxLength={120}
              autoComplete="off"
            />
          </div>
          <p className="text-[12.5px] text-muted">
            Leave these blank to reuse the title and author already stored in the PDF.
          </p>
        </div>
      </ToolShell>
    </AppShell>
  );
}
