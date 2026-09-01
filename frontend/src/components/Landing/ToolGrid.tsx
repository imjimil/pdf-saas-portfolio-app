import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CATEGORY_LABELS, TOOLS, toolsByCategory, type Tool } from '../../lib/tools';

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.path}
      className="group card flex flex-col p-5 transition duration-200 ease-ios hover:-translate-y-0.5 hover:shadow-lifted active:translate-y-0"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Icon size={20} aria-hidden />
        </span>
        {tool.badge && (
          <span className="ml-auto rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:text-brand-300">
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

export function ToolGrid() {
  return (
    <section id="tools" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-display-xs sm:text-display-sm">All {TOOLS.length} tools</h2>
          <p className="mt-4 text-base text-muted text-pretty sm:text-lg">
            Pick a tool, drop in a file, get it back. Nothing here is behind a plan or a paywall.
          </p>
        </div>

        <div className="mt-12 space-y-12 sm:mt-14 sm:space-y-14">
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

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
