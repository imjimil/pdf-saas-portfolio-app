import { motion } from 'framer-motion';
import { CircleDollarSign, Trash2, UserRound, LucideIcon } from 'lucide-react';
import { QuickStart } from './QuickStart';
import { TOOLS } from '../../lib/tools';

const TRUST: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Trash2, label: 'Deleted after download' },
  { icon: UserRound, label: 'No account needed' },
  { icon: CircleDollarSign, label: 'Free, and no watermarks' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-8 sm:pb-24 sm:pt-16">
      {/* Warm paper grain, not a coloured glow blob. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(26,28,31,0.04),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.04),transparent_60%)]"
      />

      <div className="relative mx-auto max-w-[68rem] px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          >
            <h1 className="text-display-sm sm:text-display-md lg:text-display-lg">
              Fix a PDF without
              <br className="hidden sm:block" />{' '}
              <em className="italic text-stamp-600 dark:text-stamp-400">
                handing it to anyone.
              </em>
            </h1>

            <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-muted text-pretty">
              {TOOLS.length} tools that convert, merge, split, compress and protect. The
              conversion runs on our own server — not a third-party API — and both your
              upload and the result are deleted the moment your download finishes.
            </p>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-[13px] text-muted">
                  <Icon size={15} className="text-ink-soft dark:text-sand-300" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          >
            <QuickStart />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
