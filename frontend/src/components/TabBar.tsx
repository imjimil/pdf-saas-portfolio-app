import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Clock, User, LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/cn';

/**
 * Floating navigation pill — compact, elevated, with a single sliding highlight
 * behind the active tab. Icons only so every slot stays the same width; labels
 * live in aria-label for screen readers. Tools goes straight to /tools.
 */

interface Tab {
  label: string;
  icon: LucideIcon;
  to: string;
  match: (pathname: string) => boolean;
}

const TOOL_PATHS = new Set([
  '/tools',
  '/pdf-to-word',
  '/word-to-pdf',
  '/image-to-pdf',
  '/pdf-to-text',
  '/pdf-to-epub',
  '/merge-pdf',
  '/split-pdf',
  '/compress-pdf',
  '/pdf-ocr',
  '/watermark-pdf',
  '/protect-pdf',
  '/unlock-pdf',
]);

export function TabBar() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const tabs: Tab[] = useMemo(
    () => [
      { label: 'Home', icon: Home, to: '/', match: (path) => path === '/' },
      {
        label: 'Tools',
        icon: LayoutGrid,
        to: '/tools',
        match: (path) => TOOL_PATHS.has(path),
      },
      {
        label: 'Activity',
        icon: Clock,
        to: isAuthenticated ? '/my-dashboard' : '/login',
        match: (path) => path === '/my-dashboard',
      },
      {
        label: isAuthenticated ? 'Account' : 'Sign in',
        icon: User,
        to: isAuthenticated ? '/profile' : '/login',
        match: (path) =>
          path === '/profile' || path === '/login' || path === '/register',
      },
    ],
    [isAuthenticated]
  );

  const activeIndex = tabs.findIndex((tab) => tab.match(pathname));

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div
        role="tablist"
        className="nav-pill pointer-events-auto relative mx-auto grid h-[3.375rem] w-full max-w-[20.5rem] grid-cols-4 items-stretch rounded-full p-1"
      >
        {activeIndex >= 0 && (
          <div
            aria-hidden
            className="nav-pill-indicator absolute inset-y-1 rounded-[1.125rem] transition-[transform] duration-300 ease-ios motion-reduce:transition-none"
            style={{
              width: 'calc((100% - 8px) / 4)',
              transform: `translateX(calc(${activeIndex} * 100%))`,
            }}
          />
        )}

        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              to={tab.to}
              role="tab"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              aria-selected={active}
              className={cn(
                'relative z-10 flex items-center justify-center rounded-full',
                'transition-colors duration-200 ease-ios active:scale-[0.92] motion-reduce:active:scale-100'
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden
                className={cn(
                  'transition-colors duration-200',
                  active
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-ink-muted dark:text-sand-500'
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
