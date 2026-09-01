import { cn } from '../../lib/cn';

/**
 * Wordmark. A single "Mypdftools" spelling everywhere — the old UI used three
 * different names across the nav, footer and page title.
 */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[0.6rem] bg-brand-600 shadow-glow">
        <svg
          width="17"
          height="17"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="text-white"
        >
          <path
            d="M5 2.5h6.5L16 7v10.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M11 2.5V7h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path
            d="M7 12.5h6M7 15h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-[20px] leading-none tracking-[-0.01em] text-ink dark:text-sand-100">
          Mypdftools
        </span>
      )}
    </span>
  );
}
