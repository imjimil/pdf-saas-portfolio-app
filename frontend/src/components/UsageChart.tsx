import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { cn } from '../lib/cn';

interface DailyUsage {
  date: string;
  fileCount: number;
  totalSize: number;
}

interface UsageResponse {
  dailyUsage?: DailyUsage[];
  totalFiles?: number;
  totalSize?: number;
  period?: number;
}

interface Bucket {
  start: string;
  end: string;
  fileCount: number;
  totalSize: number;
}

const PLOT_HEIGHT = 148;
const LABEL_HEIGHT = 22;
const CHART_HEIGHT = PLOT_HEIGHT + LABEL_HEIGHT;
/** Below this, bars turn into unreadable hairlines, so days get grouped instead. */
const MIN_SLOT_WIDTH = 16;

export function UsageChart({ days = 30, className }: { days?: number; className?: string }) {
  const [daily, setDaily] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [width, setWidth] = useState(0);

  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data: UsageResponse = await analyticsAPI.getUsage(days);
        if (active) setDaily(fillMissingDays(data.dailyUsage ?? [], days));
      } catch {
        if (active) setError('Could not load your usage history.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [days]);

  useLayoutEffect(() => {
    const element = plotRef.current;
    if (!element) return;

    setWidth(element.clientWidth);
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading, error]);

  const buckets = useMemo(() => {
    if (daily.length === 0 || width === 0) return [];
    const count = Math.max(4, Math.min(daily.length, Math.floor(width / MIN_SLOT_WIDTH)));
    return groupIntoBuckets(daily, count);
  }, [daily, width]);

  const totals = useMemo(
    () =>
      daily.reduce(
        (sum, day) => ({
          files: sum.files + day.fileCount,
          size: sum.size + day.totalSize,
        }),
        { files: 0, size: 0 }
      ),
    [daily]
  );

  const peak = buckets.reduce((max, bucket) => Math.max(max, bucket.fileCount), 0);

  if (loading) {
    return (
      <section className={cn('card p-5 sm:p-6', className)} aria-busy="true">
        <div className="h-4 w-40 animate-pulse rounded-full bg-ink/[0.07] dark:bg-white/[0.08]" />
        <div className="mt-6 h-[148px] animate-pulse rounded-2xl bg-ink/[0.05] dark:bg-white/[0.05]" />
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn('card p-5 sm:p-6', className)}>
        <h2 className="text-[16px] font-semibold">Activity over time</h2>
        <p role="alert" className="mt-3 text-[14px] text-red-600 dark:text-red-400">
          {error}
        </p>
      </section>
    );
  }

  const summary =
    totals.files === 0
      ? `No conversions in the last ${days} days.`
      : `${totals.files} ${totals.files === 1 ? 'conversion' : 'conversions'} over the last ${days} days, ` +
        `${formatSize(totals.size)} of files processed, busiest period ${peak} in one bar.`;

  return (
    <section className={cn('card p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[16px] font-semibold">Activity over time</h2>
        <p className="text-[13px] text-muted">Last {days} days</p>
      </div>

      {totals.files === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-ink/[0.12] px-6 py-10 text-center dark:border-white/[0.12]">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-ink/[0.05] text-ink-muted dark:bg-white/[0.06] dark:text-sand-400">
            <BarChart3 size={20} aria-hidden />
          </span>
          <p className="mt-3 text-[14.5px] font-medium">Nothing to chart yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[13.5px] text-muted text-pretty">
            Once you convert a file while signed in, your activity shows up here.
          </p>
        </div>
      ) : (
        <>
          <div ref={plotRef} className="mt-5">
            {width > 0 && (
              <svg
                role="img"
                aria-label={summary}
                width="100%"
                height={CHART_HEIGHT}
                viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
                className="overflow-visible"
              >
                <title>{summary}</title>

                {[0, 0.5, 1].map((fraction) => {
                  const y = PLOT_HEIGHT - fraction * PLOT_HEIGHT;
                  return (
                    <line
                      key={fraction}
                      x1={0}
                      x2={width}
                      y1={y}
                      y2={y}
                      className="stroke-ink/[0.08] dark:stroke-white/[0.1]"
                      strokeWidth={1}
                      strokeDasharray={fraction === 0 ? undefined : '3 4'}
                    />
                  );
                })}

                {buckets.map((bucket, index) => {
                  const slot = width / buckets.length;
                  const barWidth = Math.max(3, slot * 0.6);
                  const x = index * slot + (slot - barWidth) / 2;
                  const scaled = peak > 0 ? (bucket.fileCount / peak) * (PLOT_HEIGHT - 10) : 0;
                  const barHeight = bucket.fileCount > 0 ? Math.max(3, scaled) : 0;

                  if (barHeight === 0) return null;

                  return (
                    <rect
                      key={bucket.start}
                      x={x}
                      y={PLOT_HEIGHT - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx={Math.min(3, barWidth / 2)}
                      className="fill-brand-500 dark:fill-brand-400"
                    >
                      <title>{describeBucket(bucket)}</title>
                    </rect>
                  );
                })}

                {axisTicks(buckets).map(({ index, label }) => {
                  const slot = width / buckets.length;
                  const centre = index * slot + slot / 2;
                  const anchor =
                    index === 0 ? 'start' : index === buckets.length - 1 ? 'end' : 'middle';
                  const x = index === 0 ? 0 : index === buckets.length - 1 ? width : centre;

                  return (
                    <text
                      key={label + index}
                      x={x}
                      y={PLOT_HEIGHT + 15}
                      textAnchor={anchor}
                      className="fill-ink-muted text-[11px] dark:fill-sand-400"
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            )}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t hairline pt-4">
            <div>
              <dt className="text-[12.5px] text-muted">Conversions</dt>
              <dd className="mt-0.5 text-[19px] font-semibold tabular-nums">{totals.files}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-muted">Data processed</dt>
              <dd className="mt-0.5 text-[19px] font-semibold tabular-nums">
                {formatSize(totals.size)}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

/** The API only returns days that had activity; gaps must read as zero, not vanish. */
function fillMissingDays(raw: DailyUsage[], days: number): DailyUsage[] {
  const byDate = new Map(raw.map((day) => [day.date, day]));
  const today = new Date();
  const filled: DailyUsage[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset)
    );
    const key = date.toISOString().slice(0, 10);
    filled.push(byDate.get(key) ?? { date: key, fileCount: 0, totalSize: 0 });
  }

  return filled;
}

function groupIntoBuckets(daily: DailyUsage[], count: number): Bucket[] {
  const buckets: Bucket[] = [];

  for (let index = 0; index < count; index += 1) {
    const from = Math.floor((index * daily.length) / count);
    const to = Math.floor(((index + 1) * daily.length) / count);
    const slice = daily.slice(from, Math.max(to, from + 1));
    if (slice.length === 0) continue;

    buckets.push({
      start: slice[0].date,
      end: slice[slice.length - 1].date,
      fileCount: slice.reduce((sum, day) => sum + day.fileCount, 0),
      totalSize: slice.reduce((sum, day) => sum + day.totalSize, 0),
    });
  }

  return buckets;
}

function axisTicks(buckets: Bucket[]): Array<{ index: number; label: string }> {
  if (buckets.length === 0) return [];
  const wanted = Math.min(5, buckets.length);
  const indices = new Set<number>();

  for (let step = 0; step < wanted; step += 1) {
    indices.add(wanted === 1 ? 0 : Math.round((step * (buckets.length - 1)) / (wanted - 1)));
  }

  return [...indices].map((index) => ({ index, label: formatDay(buckets[index].start) }));
}

function describeBucket(bucket: Bucket): string {
  const range =
    bucket.start === bucket.end
      ? formatDay(bucket.start)
      : `${formatDay(bucket.start)} – ${formatDay(bucket.end)}`;
  const label = bucket.fileCount === 1 ? 'conversion' : 'conversions';
  return `${range}: ${bucket.fileCount} ${label}, ${formatSize(bucket.totalSize)}`;
}

function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default UsageChart;
