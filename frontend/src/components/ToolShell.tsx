import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, RotateCcw, ShieldCheck } from 'lucide-react';
import { Tool } from '../lib/tools';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

/**
 * Shared chrome for every tool screen.
 *
 * The six "simple" tool pages were previously ~90% identical copies of each
 * other; they now supply only their own options and call this.
 */

export interface ToolShellProps {
  tool: Tool;
  children: ReactNode;
  /** Primary action, hidden once a result exists. */
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  progress?: number | null;
  result?: {
    title: string;
    detail?: string;
    onDownload: () => void;
    onReset: () => void;
    downloadLabel?: string;
    extra?: ReactNode;
  } | null;
  error?: { message: string; hint?: string } | null;
}

export function ToolShell({
  tool,
  children,
  action,
  progress,
  result,
  error,
}: ToolShellProps) {
  const Icon = tool.icon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/tools"
        className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-muted
                   transition-colors hover:text-ink dark:hover:text-sand-100"
      >
        <ArrowLeft size={16} aria-hidden />
        All tools
      </Link>

      <header className="mb-7 flex items-start gap-3.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sand-200/80 text-ink-soft dark:bg-white/[0.08] dark:text-sand-200">
          <Icon size={23} aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <h1 className="text-display-xs">{tool.name}</h1>
          <p className="mt-1 text-[15px] leading-snug text-muted text-pretty">
            {tool.summary}
          </p>
        </div>
      </header>

      {result ? (
        <ResultPanel {...result} />
      ) : (
        <div className="space-y-5">
          {children}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10"
            >
              <p className="text-[14.5px] font-medium text-red-800 dark:text-red-300">
                {error.message}
              </p>
              {error.hint && (
                <p className="mt-1 text-[13.5px] text-red-700/80 dark:text-red-300/70">
                  {error.hint}
                </p>
              )}
            </div>
          )}

          {typeof progress === 'number' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px] font-medium">
                <span className="text-ink-soft dark:text-sand-300">
                  {progress < 90 ? 'Uploading' : 'Processing'}
                </span>
                <span className="tabular-nums text-muted">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.08] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-ios"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {action && (
            <Button
              onClick={action.onClick}
              disabled={action.disabled}
              loading={action.loading}
              size="lg"
              fullWidth
            >
              {action.label}
            </Button>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[12.5px] text-muted">
            <ShieldCheck size={14} aria-hidden />
            Files are processed securely and deleted right after you download them.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  title,
  detail,
  onDownload,
  onReset,
  downloadLabel = 'Download',
  extra,
}: NonNullable<ToolShellProps['result']>) {
  return (
    <div className="card animate-scale-in p-6 text-center sm:p-8">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-500/12 text-brand-600 dark:text-brand-400">
        <CheckCircle2 size={28} aria-hidden />
      </span>

      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      {detail && <p className="mt-1.5 text-[15px] text-muted text-pretty">{detail}</p>}

      {extra}

      <div className={cn('mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center')}>
        <Button onClick={onDownload} icon={Download} size="lg">
          {downloadLabel}
        </Button>
        <Button onClick={onReset} variant="secondary" icon={RotateCcw} size="lg">
          Do another
        </Button>
      </div>
    </div>
  );
}
