import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { TOOLS, CATEGORY_LABELS, toolsByCategory } from '../lib/tools';
import { cn } from '../lib/cn';

/**
 * The tool picker.
 *
 * Renders as a centred popover on desktop and a bottom sheet on mobile, which
 * is where iOS puts reachable actions. Includes search because the catalogue is
 * past the point where scanning a grid is fastest.
 */
export function ToolSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Only steal focus on desktop; a mobile keyboard covering the sheet is worse.
    if (window.matchMedia('(min-width: 768px)').matches) {
      const timer = window.setTimeout(() => searchRef.current?.focus(), 60);
      return () => {
        window.clearTimeout(timer);
        document.removeEventListener('keydown', onKeyDown);
      };
    }

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return null;
    return TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(term) ||
        tool.summary.toLowerCase().includes(term)
    );
  }, [query]);

  if (!open) return null;

  const grouped = toolsByCategory();

  return (
    <div
      className="fixed inset-0 z-50 md:inset-auto md:left-0 md:right-0 md:top-[4.5rem] md:z-40
                 md:flex md:justify-center md:pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a tool"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/25 backdrop-blur-sm animate-scale-in md:hidden"
      />

      <div
        ref={panelRef}
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl border-t hairline',
          'bg-white pb-safe shadow-float animate-slide-up dark:bg-[#141917]',
          'md:static md:pointer-events-auto md:max-h-[70vh] md:w-[min(46rem,calc(100vw-2rem))] md:rounded-3xl md:border md:animate-scale-in'
        )}
      >
        {/* Grab handle: the standard affordance for a dismissable iOS sheet. */}
        <div className="sticky top-0 z-10 bg-inherit px-4 pt-3 md:px-5 md:pt-5">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-ink/15 dark:bg-white/20 md:hidden" />

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search tools"
                aria-label="Search tools"
                className="h-11 w-full rounded-full border-0 bg-sand-100 pl-10 pr-4 text-[15px] text-ink
                           placeholder:text-ink-muted focus:ring-2 focus:ring-brand-500
                           dark:bg-white/[0.07] dark:text-sand-100"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tool list"
              className="tap-target grid place-items-center rounded-full text-ink-muted hover:bg-ink/[0.05] dark:hover:bg-white/[0.07]"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-6 pt-4 md:px-5">
          {results ? (
            results.length ? (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {results.map((tool) => (
                  <ToolRow key={tool.id} tool={tool} onClick={onClose} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-[15px] text-muted">
                No tools match “{query}”.
              </p>
            )
          ) : (
            <div className="space-y-5">
              {grouped.map(({ category, tools }) => (
                <section key={category}>
                  <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {tools.map((tool) => (
                      <ToolRow key={tool.id} tool={tool} onClick={onClose} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolRow({
  tool,
  onClick,
}: {
  tool: (typeof TOOLS)[number];
  onClick: () => void;
}) {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.path}
      onClick={onClick}
      className="group flex items-start gap-3 rounded-2xl p-2.5 transition-colors
                 hover:bg-sand-100 active:bg-sand-200 dark:hover:bg-white/[0.07]"
    >
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/10
                   text-brand-600 transition-transform duration-200 ease-spring
                   group-hover:scale-105 dark:bg-brand-500/15 dark:text-brand-400"
      >
        <Icon size={17} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-medium text-ink dark:text-sand-100">
            {tool.name}
          </span>
          {tool.badge && (
            <span className="rounded-full bg-brand-500/12 px-1.5 py-px text-[10px] font-semibold text-brand-700 dark:text-brand-400">
              {tool.badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
          {tool.summary}
        </span>
      </span>
    </Link>
  );
}
