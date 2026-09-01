import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlignLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Combine,
  Droplets,
  FileText,
  FileType2,
  HardDrive,
  Image as ImageIcon,
  Inbox,
  Lock,
  LucideIcon,
  Minimize2,
  ScanText,
  Scissors,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { UsageChart } from '../components/UsageChart';
import { Button, ButtonLink } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, ApiError, fileAPI } from '../services/api';

interface ActivityRecord {
  _id: string;
  originalFileName: string;
  processedFileName: string;
  operation: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface HistoryResponse {
  files: ActivityRecord[];
  pagination: Pagination;
}

interface Summary {
  total: number;
  bytes: number;
  topOperation: string | null;
}

interface UsageResponse {
  totalFiles: number;
  totalSize: number;
}

interface OperationsResponse {
  operations: Array<{ _id: string; fileCount: number }>;
}

const OPERATION_LABELS: Record<string, string> = {
  'pdf-to-word': 'PDF to Word',
  'word-to-pdf': 'Word to PDF',
  'image-to-pdf': 'Image to PDF',
  'pdf-to-text': 'PDF to Text',
  'pdf-to-epub': 'PDF to EPUB',
  split: 'Split PDF',
  merge: 'Merge PDF',
  compress: 'Compress PDF',
  watermark: 'Watermark PDF',
  protect: 'Protect PDF',
  unlock: 'Unlock PDF',
  ocr: 'PDF OCR',
};

const OPERATION_ICONS: Record<string, LucideIcon> = {
  'pdf-to-word': FileType2,
  'word-to-pdf': FileText,
  'image-to-pdf': ImageIcon,
  'pdf-to-text': AlignLeft,
  'pdf-to-epub': BookOpen,
  split: Scissors,
  merge: Combine,
  compress: Minimize2,
  watermark: Droplets,
  protect: Lock,
  unlock: Unlock,
  ocr: ScanText,
};

const PAGE_SIZE = 10;
/** Window used for the "most used tool" card and the chart. */
const SUMMARY_DAYS = 365;

export default function UserDashboard() {
  const { user } = useAuth();

  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [page, setPage] = useState(1);
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data: HistoryResponse = await fileAPI.getHistory(page, PAGE_SIZE, {
        operation: operation || undefined,
      });
      setRecords(data.files);
      setPagination(data.pagination);

      // Removing the last entry on a page would otherwise strand the view.
      if (data.files.length === 0 && data.pagination.pages > 0 && page > data.pagination.pages) {
        setPage(data.pagination.pages);
      }
    } catch (caught) {
      setError(messageFrom(caught, 'Could not load your activity.'));
    } finally {
      setLoading(false);
    }
  }, [page, operation]);

  const loadSummary = useCallback(async () => {
    try {
      const [usage, operations]: [UsageResponse, OperationsResponse] = await Promise.all([
        analyticsAPI.getUsage(SUMMARY_DAYS),
        analyticsAPI.getOperations(SUMMARY_DAYS),
      ]);

      setSummary({
        total: usage.totalFiles,
        bytes: usage.totalSize,
        // The endpoint already sorts by descending file count.
        topOperation: operations.operations[0]?._id ?? null,
      });
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await fileAPI.deleteFile(id);
      setPendingRemoval(null);
      toast.success('Entry removed', 'It no longer appears in your activity.');
      await Promise.all([loadHistory(), loadSummary()]);
    } catch (caught) {
      toast.error(messageFrom(caught, 'Could not remove that entry.'));
    } finally {
      setRemoving(null);
    }
  };

  const firstOnPage = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastOnPage = Math.min(page * PAGE_SIZE, pagination.total);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="animate-fade-up">
          <h1 className="text-display-xs">Your activity</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            Signed in as <span className="text-ink dark:text-sand-200">{user?.email}</span>
          </p>
          <p className="mt-3 flex items-start gap-2 text-[13.5px] text-muted text-pretty">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
            This is a record of what you converted, not a file store. Processed files are deleted
            from our servers as soon as your download finishes, so they can't be fetched again
            here.
          </p>
        </header>

        <div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={Activity}
            label="Conversions"
            value={summary ? String(summary.total) : '—'}
          />
          <StatCard
            icon={HardDrive}
            label="Data processed"
            value={summary ? formatSize(summary.bytes) : '—'}
          />
          <StatCard
            icon={Sparkles}
            label="Most used tool"
            value={
              summary?.topOperation
                ? OPERATION_LABELS[summary.topOperation] ?? summary.topOperation
                : '—'
            }
          />
        </div>

        <UsageChart days={30} className="mt-4 sm:mt-5" />

        <section className="mt-8" aria-labelledby="activity-log">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="activity-log" className="text-[17px] font-semibold">
              Recent conversions
            </h2>

            <div>
              <label
                htmlFor="operation-filter"
                className="mb-1.5 block text-[12.5px] font-medium text-muted"
              >
                Filter by tool
              </label>
              <select
                id="operation-filter"
                value={operation}
                onChange={(event) => {
                  setOperation(event.target.value);
                  setPage(1);
                  setPendingRemoval(null);
                }}
                className="h-11 rounded-xl border border-ink/[0.09] bg-white px-3 text-[14.5px] text-ink
                           transition-colors focus:border-brand-500 dark:border-white/[0.1]
                           dark:bg-white/[0.04] dark:text-sand-100"
              >
                <option value="">All tools</option>
                {Object.entries(OPERATION_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10"
            >
              <p className="text-[14px] font-medium text-red-800 dark:text-red-300">{error}</p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={loadHistory}>
                  Try again
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <SkeletonList />
          ) : !error && records.length === 0 ? (
            <div className="card mt-4 px-6 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink/[0.05] text-ink-muted dark:bg-white/[0.06] dark:text-sand-400">
                <Inbox size={22} aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                {operation ? 'Nothing with that tool yet' : 'No activity yet'}
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-muted text-pretty">
                {operation
                  ? 'Try a different tool in the filter, or clear it to see everything.'
                  : 'Convert something while signed in and it will be listed here.'}
              </p>
              <div className="mt-5 flex justify-center gap-2.5">
                {operation && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOperation('');
                      setPage(1);
                    }}
                  >
                    Clear filter
                  </Button>
                )}
                <ButtonLink to="/tools">Browse tools</ButtonLink>
              </div>
            </div>
          ) : (
            !error && (
              <>
                <ul className="mt-4 space-y-3 md:hidden">
                  {records.map((record) => {
                    const Icon = OPERATION_ICONS[record.operation] ?? FileText;
                    return (
                      <li key={record._id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                            <Icon size={18} aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14.5px] font-medium">
                              {OPERATION_LABELS[record.operation] ?? record.operation}
                            </p>
                            <p className="mt-0.5 truncate text-[13.5px] text-muted">
                              {record.originalFileName}
                            </p>
                            <p className="mt-1 text-[12.5px] text-muted">
                              <time dateTime={record.createdAt} title={formatExact(record.createdAt)}>
                                {formatRelative(record.createdAt)}
                              </time>
                              <span aria-hidden> · </span>
                              {formatSize(record.fileSize)}
                            </p>
                          </div>
                          <RemoveButton
                            fileName={record.originalFileName}
                            onClick={() => setPendingRemoval(record._id)}
                          />
                        </div>

                        {pendingRemoval === record._id && (
                          <ConfirmRemoval
                            loading={removing === record._id}
                            onCancel={() => setPendingRemoval(null)}
                            onConfirm={() => handleRemove(record._id)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="card mt-4 hidden overflow-hidden md:block">
                  <table className="w-full text-left">
                    <caption className="sr-only">
                      Your recent conversions, newest first
                    </caption>
                    <thead>
                      <tr className="border-b hairline">
                        <th scope="col" className="px-5 py-3 text-[12.5px] font-semibold text-muted">
                          Tool
                        </th>
                        <th scope="col" className="px-5 py-3 text-[12.5px] font-semibold text-muted">
                          File
                        </th>
                        <th scope="col" className="px-5 py-3 text-[12.5px] font-semibold text-muted">
                          Size
                        </th>
                        <th scope="col" className="px-5 py-3 text-[12.5px] font-semibold text-muted">
                          When
                        </th>
                        <th scope="col" className="px-5 py-3 text-right text-[12.5px] font-semibold text-muted">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => {
                        const Icon = OPERATION_ICONS[record.operation] ?? FileText;
                        return (
                          <tr key={record._id} className="border-b hairline last:border-0">
                            <td className="px-5 py-3.5">
                              <span className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                  <Icon size={16} aria-hidden />
                                </span>
                                <span className="text-[14px] font-medium">
                                  {OPERATION_LABELS[record.operation] ?? record.operation}
                                </span>
                              </span>
                            </td>
                            <td className="max-w-[18rem] truncate px-5 py-3.5 text-[14px] text-muted">
                              {record.originalFileName}
                            </td>
                            <td className="px-5 py-3.5 text-[14px] tabular-nums text-muted">
                              {formatSize(record.fileSize)}
                            </td>
                            <td className="px-5 py-3.5 text-[14px] text-muted">
                              <time dateTime={record.createdAt} title={formatExact(record.createdAt)}>
                                {formatRelative(record.createdAt)}
                              </time>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex justify-end">
                                {pendingRemoval === record._id ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      loading={removing === record._id}
                                      onClick={() => handleRemove(record._id)}
                                    >
                                      Remove
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setPendingRemoval(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <RemoveButton
                                    fileName={record.originalFileName}
                                    onClick={() => setPendingRemoval(record._id)}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px] text-muted" aria-live="polite">
                    Showing {firstOnPage}–{lastOnPage} of {pagination.total}
                  </p>

                  {pagination.pages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={ChevronLeft}
                        disabled={page <= 1}
                        onClick={() => {
                          setPendingRemoval(null);
                          setPage((current) => Math.max(1, current - 1));
                        }}
                      >
                        Previous
                      </Button>
                      <span className="text-[13px] tabular-nums text-muted">
                        {page} / {pagination.pages}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        iconRight={ChevronRight}
                        disabled={page >= pagination.pages}
                        onClick={() => {
                          setPendingRemoval(null);
                          setPage((current) => Math.min(pagination.pages, current + 1));
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon size={17} aria-hidden />
      </span>
      <p className="mt-3 text-[12.5px] text-muted">{label}</p>
      <p className="mt-0.5 text-[21px] font-semibold leading-tight">{value}</p>
      {note && <p className="mt-1 text-[11.5px] text-muted">{note}</p>}
    </div>
  );
}

function RemoveButton({ fileName, onClick }: { fileName: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remove ${fileName} from your activity`}
      className="tap-target grid shrink-0 place-items-center rounded-xl text-ink-muted
                 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-sand-400
                 dark:hover:bg-red-500/10 dark:hover:text-red-400"
    >
      <Trash2 size={17} aria-hidden />
    </button>
  );
}

function ConfirmRemoval({
  loading,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/25 dark:bg-red-500/10"
    >
      <p className="text-[13.5px] text-red-800 dark:text-red-300">
        Remove this entry from your activity log?
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" variant="danger" loading={loading} onClick={onConfirm}>
          Remove
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading your activity">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="card flex items-center gap-3 p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-ink/[0.07] dark:bg-white/[0.08]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-ink/[0.07] dark:bg-white/[0.08]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-ink/[0.05] dark:bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatExact(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelative(iso: string): string {
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);

  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour');

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relative.format(days, 'day');

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return relative.format(months, 'month');

  return relative.format(Math.round(months / 12), 'year');
}
