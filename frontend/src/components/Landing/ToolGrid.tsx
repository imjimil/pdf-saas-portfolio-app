import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { CATEGORY_LABELS, TOOLS, toolsByCategory, type Tool } from '../../lib/tools';

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.path}
      className="group card hidden flex-col p-5 transition duration-200 ease-ios hover:-translate-y-0.5 hover:shadow-lifted active:translate-y-0 md:flex"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sand-200/80 text-ink-soft dark:bg-white/[0.08] dark:text-sand-200">
          <Icon size={20} aria-hidden />
        </span>
        {tool.badge && (
          <span className="ml-auto rounded-full bg-stamp-500/12 px-2.5 py-1 text-[11px] font-medium text-stamp-600 dark:text-stamp-400">
            {tool.badge}
          </span>
        )}
      </div>

      <h3 className="mt-4 text-[17px] font-semibold text-ink dark:text-sand-100">{tool.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">{tool.summary}</p>

      <span className="mt-4 inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-brand-600 dark:text-brand-400">
        Open
        <ArrowRight
          size={15}
          className="transition-transform duration-200 ease-ios group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </Link>
  );
}

function ToolRow({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <Link to={tool.path} className="tool-row group md:hidden">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sand-200/70 text-ink-soft dark:bg-white/[0.07] dark:text-sand-200">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15.5px] font-medium text-ink dark:text-sand-100">
            {tool.name}
          </span>
          {tool.badge && (
            <span className="shrink-0 rounded-full bg-stamp-500/12 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-stamp-600 dark:text-stamp-400">
              {tool.badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 line-clamp-1 text-[13px] text-muted">{tool.summary}</span>
      </span>
      <ChevronRight
        size={17}
        className="shrink-0 text-ink-faint transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

/** Horizontal strip of the most-used tools — a thumb-reachable shortcut on phones. */
function PopularStrip() {
  const popular = TOOLS.filter((t) =>
    ['pdf-to-word', 'compress-pdf', 'merge-pdf', 'split-pdf', 'pdf-ocr'].includes(t.id)
  );

  return (
    <div className="mt-8 md:hidden">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Popular
      </p>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {popular.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              to={tool.path}
              className="flex w-[5.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl bg-sand-100/90 px-2 py-3.5 transition-colors active:bg-sand-200 dark:bg-white/[0.05] dark:active:bg-white/[0.09]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-ink-soft shadow-card dark:bg-white/[0.08] dark:text-sand-200">
                <Icon size={20} aria-hidden />
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-ink-soft dark:text-sand-300">
                {tool.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ToolGrid() {
  return (
    <section id="tools" className="py-14 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-display-xs sm:text-display-sm">All {TOOLS.length} tools</h2>
          <p className="mt-4 text-base text-muted text-pretty sm:text-lg">
            Pick a tool, drop in a file, get it back. Nothing here is behind a plan or a paywall.
          </p>
        </div>

        <PopularStrip />

        <div className="mt-10 space-y-10 sm:mt-14 sm:space-y-14">
          {toolsByCategory().map(({ category, tools }) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-soft dark:text-sand-300">
                  {CATEGORY_LABELS[category]}
                </h3>
                <span className="h-px flex-1 bg-ink/[0.07] dark:bg-white/[0.08]" aria-hidden />
                <span className="text-sm text-muted">{tools.length}</span>
              </div>

              {/* Phone: Settings-style rows. Desktop: card grid. */}
              <div className="mt-1 md:mt-5">
                {tools.map((tool) => (
                  <ToolRow key={`row-${tool.id}`} tool={tool} />
                ))}
                <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <ToolCard key={`card-${tool.id}`} tool={tool} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
