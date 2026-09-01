import { motion } from 'framer-motion';

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Drop the file in',
    body: 'Straight from the home page, before you have even picked a tool. Up to 50 MB, over an encrypted connection.',
  },
  {
    title: 'Say what you want done',
    body: 'Only the tools that can actually open your file are offered, so there is no menu to read through.',
  },
  {
    title: 'Take it and go',
    body: 'The result downloads to your device. Your upload and our copy are both deleted the moment it lands.',
  },
];

/**
 * Deliberately not three cards in a row: a numbered column beside the heading
 * reads as an argument rather than a feature grid, and it collapses to a plain
 * list on a phone without reflowing into an awkward middle state.
 */
export function Steps() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[68rem] px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="text-display-xs sm:text-display-sm">
              Three steps,
              <br className="hidden sm:block" /> no detours
            </h2>
            <p className="mt-4 max-w-sm text-[15.5px] leading-relaxed text-muted text-pretty">
              No wizard, no account wall, and no upsell screen between you and your
              file.
            </p>
          </div>

          <ol className="space-y-0">
            {STEPS.map(({ title, body }, index) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] }}
                className="flex gap-5 border-t hairline py-6 first:border-t-0 first:pt-0 sm:gap-7"
              >
                <span
                  aria-hidden
                  className="font-display text-[2.25rem] leading-none text-brand-600/35 dark:text-brand-400/40"
                >
                  {index + 1}
                </span>
                <div className="pt-1">
                  <h3 className="text-[17px] font-semibold text-ink dark:text-sand-100">
                    {title}
                  </h3>
                  <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-muted text-pretty">
                    {body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
