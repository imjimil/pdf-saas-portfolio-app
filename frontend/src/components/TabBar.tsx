import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Clock, User, LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToolSheet } from './ToolSheet';
import { cn } from '../lib/cn';

/**
 * Mobile bottom tab bar, modelled on the iOS pattern: a translucent bar pinned
 * above the home indicator holding the app's top-level destinations.
 *
 * This also fixes a real regression — the old hamburger menu hid every tool
 * from signed-out visitors on mobile, so guests literally could not reach the
 * product from their phone.
 */

interface Tab {
  label: string;
  icon: LucideIcon;
  to?: string;
  action?: 'tools';
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
]);

export function TabBar() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const tabs: Tab[] = [
    { label: 'Home', icon: Home, to: '/', match: (path) => path === '/' },
    {
      label: 'Tools',
      icon: LayoutGrid,
      action: 'tools',
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
      match: (path) => path === '/profile' || path === '/login' || path === '/register',
    },
  ];

  return (
    <>
      <ToolSheet open={toolsOpen} onClose={() => setToolsOpen(false)} />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t hairline surface-glass pb-safe md:hidden"
      >
        <ul className="grid h-[4.25rem] grid-cols-4">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;

            const inner = (
              <span
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 transition-colors duration-200',
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-muted'
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.3 : 1.9}
                  aria-hidden
                  className="transition-transform duration-200 ease-spring active:scale-90"
                />
                <span className="text-[10.5px] font-medium tracking-tight">{tab.label}</span>
              </span>
            );

            return (
              <li key={tab.label} className="contents">
                {tab.action === 'tools' ? (
                  <button
                    type="button"
                    onClick={() => setToolsOpen(true)}
                    aria-expanded={toolsOpen}
                    aria-current={active ? 'page' : undefined}
                    className="tap-target"
                  >
                    {inner}
                  </button>
                ) : (
                  <Link
                    to={tab.to!}
                    aria-current={active ? 'page' : undefined}
                    className="tap-target"
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
