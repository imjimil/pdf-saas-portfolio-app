import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, SearchX, ShieldCheck } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/ui/Button';
import { CATEGORY_LABELS, Tool, toolsByCategory } from '../lib/tools';

export default function Tools() {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return toolsByCategory();

    return toolsByCategory()
      .map((group) => ({
        ...group,
        tools: group.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(needle) ||
            tool.summary.toLowerCase().includes(needle)
        ),
      }))
      .filter((group) => group.tools.length > 0);
  }, [query]);

  const matches = groups.reduce((total, group) => total + group.tools.length, 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="animate-fade-up">
          <h1 className="text-display-xs sm:text-display-sm">Every tool, in one place</h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted text-pretty">
            All of them are free and none of them need an account. Files are processed on our
            server and deleted the moment your download finishes.
          </p>
        </header>

        <div className="relative mt-7 sm:mt-8">
          <label htmlFor="tool-search" className="sr-only">
            Search tools
          </label>
          <Search
            size={18}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted dark:text-sand-400"
          />
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or by what it does"
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-ink/[0.09] bg-white pl-11 pr-4 text-[15px]
                       text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand-500
                       dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-sand-100
                       dark:placeholder:text-sand-500"
          />
        </div>

        {query.trim() && (
          <p aria-live="polite" className="mt-3 text-[13.5px] text-muted">
            {matches === 0
              ? 'No tools match your search.'
              : `${matches} ${matches === 1 ? 'tool' : 'tools'} match “${query.trim()}”.`}
          </p>
        )}

        {matches === 0 ? (
          <div className="card mt-6 animate-scale-in px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink/[0.05] text-ink-muted dark:bg-white/[0.06] dark:text-sand-400">
              <SearchX size={22} aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Nothing matched that</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-muted text-pretty">
              Try a shorter word, or clear the search to browse the full catalogue.
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="secondary" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {groups.map((group) => (
              <section key={group.category} aria-labelledby={`category-${group.category}`}>
                <h2
                  id={`category-${group.category}`}
                  className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted dark:text-sand-400"
                >
                  {CATEGORY_LABELS[group.category]}
                </h2>
                <div className="mt-3.5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="mt-10 flex items-start justify-center gap-2 text-center text-[13px] text-muted">
          <ShieldCheck size={15} className="mt-px shrink-0" aria-hidden />
          Nothing you upload is kept. Create an account only if you want a log of what you
          converted.
        </p>
      </div>
    </AppShell>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.path}
      className="card group flex flex-col p-5 transition-[transform,box-shadow] duration-200 ease-ios
                 hover:-translate-y-0.5 hover:shadow-lifted"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon size={21} aria-hidden />
      </span>

      <h3 className="mt-3.5 flex flex-wrap items-center gap-2 text-[16px] font-semibold">
        {tool.name}
        {tool.badge && (
          <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
            {tool.badge}
          </span>
        )}
      </h3>

      <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-muted text-pretty">
        {tool.summary}
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-brand-600 dark:text-brand-400">
        Open tool
        <ArrowRight
          size={15}
          aria-hidden
          className="transition-transform duration-200 ease-ios group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
