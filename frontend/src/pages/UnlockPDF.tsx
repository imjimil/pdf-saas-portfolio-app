import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { TextField } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('unlock-pdf')!;

export default function UnlockPDF() {
  const [files, setFiles] = usePendingFiles();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Remove password',
          onClick: () =>
            run({ endpoint: '/pdf/unlock', files, fields: { password } }),
          disabled: files.length === 0,
          loading: running,
        }}
        progress={progress}
        error={error}
        result={
          result
            ? {
                title: 'Password removed',
                detail: 'The PDF now opens without a password.',
                downloadLabel: 'Download unlocked PDF',
                onDownload: download,
                onReset: () => {
                  reset();
                  setFiles([]);
                  setPassword('');
                },
              }
            : null
        }
      >
        <Dropzone accept={tool.accept} files={files} onChange={setFiles} />

        <div className="card space-y-4 p-4 sm:p-5">
          <TextField
            label="Current password"
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Leave blank if the file only has permission restrictions"
            trailing={
              <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className="tap-target grid place-items-center rounded-full text-ink-muted
                           transition-colors hover:text-ink dark:text-sand-400 dark:hover:text-sand-100"
              >
                {visible ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            }
          />

          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl bg-brand-500/[0.07] p-3.5 text-[13px] text-ink-soft dark:bg-brand-500/10 dark:text-sand-200"
          >
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
            <span className="text-pretty">
              This removes a password you already know. It cannot guess or break one, so a
              file you do not have the password for will come back with an error.
            </span>
          </div>
        </div>
      </ToolShell>
    </AppShell>
  );
}
