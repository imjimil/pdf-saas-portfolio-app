import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Lock, Server, Trash2, type LucideIcon } from 'lucide-react';

const POINTS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Trash2,
    title: 'Deleted after download',
    body: 'The file you upload and the file we generate are removed as soon as your download finishes.',
  },
  {
    icon: Lock,
    title: 'Encrypted in transit',
    body: 'Every upload and download runs over HTTPS, so nothing travels across the network in the clear.',
  },
  {
    icon: Server,
    title: 'Processed on our own server',
    body: 'Conversions run on our machines with open-source tooling. Your documents are not handed to a third-party API.',
  },
  {
    icon: KeyRound,
    title: 'No account required',
    body: 'Use any tool without signing up. An account only adds a history of what you converted.',
  },
];

export function Privacy() {
  return (
    <section className="py-14 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-display-xs sm:text-display-sm">Your documents stay yours</h2>
          <p className="mt-4 text-base text-muted text-pretty sm:text-lg">
            Contracts, statements, medical scans — it matters where they go. Here is exactly what
            happens.
          </p>
        </div>

        {/* Phone: one continuous list. Desktop: two-column cards. */}
        <ul className="mt-8 divide-y hairline md:mt-12 md:grid md:grid-cols-2 md:gap-4 md:divide-y-0">
          {POINTS.map(({ icon: Icon, title, body }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: [0.32, 0.72, 0, 1] }}
              className="flex gap-4 py-5 md:card md:flex-col md:p-6"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sand-200/80 text-ink-soft dark:bg-white/[0.08] dark:text-sand-200 md:h-11 md:w-11">
                <Icon size={18} aria-hidden />
              </span>
              <div>
                <h3 className="text-[16px] font-semibold text-ink dark:text-sand-100 md:text-[17px]">
                  {title}
                </h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted text-pretty md:mt-1.5 md:text-sm">
                  {body}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>

        <Link
          to="/privacy"
          className="tap-target mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 md:mt-8"
        >
          Read the full privacy policy
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
