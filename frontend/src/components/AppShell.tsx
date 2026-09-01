import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { TabBar } from './TabBar';
import { cn } from '../lib/cn';

/**
 * Page frame: translucent top bar everywhere, plus a bottom tab bar on mobile.
 * Content reserves space for the tab bar so nothing hides behind it.
 */
export function AppShell({
  children,
  className,
  footer,
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navigation />
      <main className={cn('flex-1 pb-tabbar md:pb-0', className)}>{children}</main>
      {footer}
      <TabBar />
    </div>
  );
}
