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
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-display-xs sm:text-display-sm">Your documents stay yours</h2>
          <p className="mt-4 text-base text-muted text-pretty sm:text-lg">
            Contracts, statements, medical scans — it matters where they go. Here is exactly what
            happens.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2">
          {POINTS.map(({ icon: Icon, title, body }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: [0.32, 0.72, 0, 1] }}
              className="card p-5 sm:p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Icon size={20} aria-hidden />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-ink dark:text-sand-100">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">{body}</p>
            </motion.div>
          ))}
        </div>

        <Link
          to="/privacy"
          className="tap-target mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Read the full privacy policy
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
