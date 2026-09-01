import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Moon, Sun, LogOut, User as UserIcon, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { ToolSheet } from './ToolSheet';
import { Logo } from './ui/Logo';
import { Button, ButtonLink } from './ui/Button';
import { cn } from '../lib/cn';

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

/**
 * Top bar.
 *
 * Translucent and blurred like iOS navigation chrome: it sits flush with the
 * page at rest and grows a hairline separator once content scrolls beneath it.
 * On mobile the primary destinations live in the bottom TabBar instead, so this
 * bar stays deliberately sparse.
 */
export function Navigation() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setToolsOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [accountOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 surface-glass transition-shadow duration-300',
        scrolled && 'border-b hairline'
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6"
      >
        <Link to="/" aria-label="Mypdftools home" className="shrink-0">
          <Logo />
        </Link>

        <div className="relative hidden md:flex md:items-center md:gap-1">
          <button
            type="button"
            onClick={() => setToolsOpen((open) => !open)}
            aria-expanded={toolsOpen}
            aria-haspopup="dialog"
            className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[14.5px] font-medium
                       text-ink-soft transition-colors hover:bg-ink/[0.05] dark:text-sand-300 dark:hover:bg-white/[0.07]"
          >
            Tools
            <ChevronDown
              size={15}
              className={cn('transition-transform duration-200', toolsOpen && 'rotate-180')}
              aria-hidden
            />
          </button>
          <ToolSheet open={toolsOpen} onClose={() => setToolsOpen(false)} />

          <NavLink to="/tools">All tools</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/tools"
            className={cn(
              'tap-target inline-flex h-9 items-center rounded-full px-3 text-[14px] font-medium md:hidden',
              TOOL_PATHS.has(location.pathname)
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-ink-soft dark:text-sand-300'
            )}
          >
            Tools
          </Link>

          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="tap-target grid place-items-center rounded-full text-ink-soft transition-colors
                       hover:bg-ink/[0.05] dark:text-sand-300 dark:hover:bg-white/[0.07]"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <div ref={accountRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="tap-target grid h-9 w-9 place-items-center rounded-full bg-brand-600
                           text-[13px] font-semibold uppercase text-white"
              >
                {(user?.name || user?.email || '?').charAt(0)}
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-scale-in
                             overflow-hidden rounded-2xl border hairline bg-white shadow-lifted dark:bg-[#191e1c]"
                >
                  <div className="border-b hairline px-3.5 py-3">
                    <p className="truncate text-[13.5px] font-medium text-ink dark:text-sand-100">
                      {user?.name || 'Signed in'}
                    </p>
                    <p className="truncate text-[12.5px] text-muted">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <MenuItem to="/my-dashboard" icon={History}>Activity</MenuItem>
                    <MenuItem to="/profile" icon={UserIcon}>Account settings</MenuItem>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px]
                                 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut size={16} aria-hidden />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <ButtonLink to="/register" size="sm">
                Get started
              </ButtonLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 items-center rounded-full px-3 text-[14.5px] font-medium transition-colors',
        active
          ? 'bg-ink/[0.06] text-ink dark:bg-white/[0.09] dark:text-sand-100'
          : 'text-ink-soft hover:bg-ink/[0.05] dark:text-sand-300 dark:hover:bg-white/[0.07]'
      )}
    >
      {children}
    </Link>
  );
}

function MenuItem({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: typeof History;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[14px] text-ink-soft
                 transition-colors hover:bg-sand-100 dark:text-sand-200 dark:hover:bg-white/[0.07]"
    >
      <Icon size={16} aria-hidden />
      {children}
    </Link>
  );
}

export default Navigation;
