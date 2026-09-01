import { useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ToolShell } from '../components/ToolShell';
import { Dropzone } from '../components/Dropzone';
import { CheckboxField, TextField } from '../components/ui/Field';
import { useToolRunner } from '../hooks/useToolRunner';
import { getTool } from '../lib/tools';
import { usePendingFiles } from '../hooks/usePendingFiles';

const tool = getTool('protect-pdf')!;

const MIN_LENGTH = 4;

export default function ProtectPDF() {
  const [files, setFiles] = usePendingFiles();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowModifying, setAllowModifying] = useState(false);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowAnnotating, setAllowAnnotating] = useState(false);
  const { run, download, reset, running, progress, error, result } = useToolRunner();

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready =
    files.length > 0 && password.length >= MIN_LENGTH && confirm === password;

  return (
    <AppShell>
      <ToolShell
        tool={tool}
        action={{
          label: 'Protect PDF',
          onClick: () =>
            run({
              endpoint: '/pdf/protect',
              files,
              fields: {
                password,
                allowPrinting,
                allowModifying,
                allowCopying,
                allowAnnotating,
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
                title: 'Your PDF is locked',
                detail: `Anyone opening it will need the password you set${
                  result.meta.encryption ? ` (${result.meta.encryption} encryption)` : ''
                }.`,
                downloadLabel: 'Download protected PDF',
                onDownload: download,
                onReset: () => {
                  reset();
                  setFiles([]);
                  setPassword('');
                  setConfirm('');
                },
              }
            : null
        }
      >
        <Dropzone accept={tool.accept} files={files} onChange={setFiles} />

        <div className="card space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Password"
              type={visible ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="At least 4 characters"
              error={tooShort ? 'Use at least 4 characters.' : undefined}
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
            <TextField
              label="Confirm password"
              type={visible ? 'text' : 'password'}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Type it again"
              error={mismatch ? 'The two passwords do not match.' : undefined}
            />
          </div>

          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span className="text-pretty">
              If you forget this password, the file cannot be recovered. Save it somewhere
              safe before you download.
            </span>
          </div>

          <div>
            <p className="text-[13.5px] font-medium text-ink-soft dark:text-sand-200">
              What readers are allowed to do
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              These apply once the file is open.
            </p>
            <div className="mt-1.5 grid sm:grid-cols-2">
              <CheckboxField
                label="Printing"
                checked={allowPrinting}
                onChange={setAllowPrinting}
              />
              <CheckboxField
                label="Editing content"
                checked={allowModifying}
                onChange={setAllowModifying}
              />
              <CheckboxField
                label="Copying text"
                checked={allowCopying}
                onChange={setAllowCopying}
              />
              <CheckboxField
                label="Adding comments"
                checked={allowAnnotating}
                onChange={setAllowAnnotating}
              />
            </div>
          </div>
        </div>
      </ToolShell>
    </AppShell>
  );
}
