import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { useDarkMode } from '../../contexts/DarkModeContext';

/**
 * App-wide notifications. Replaces the `window.alert()` calls that previously
 * blocked the UI thread and looked like a browser error.
 */
export function Toaster() {
  const { isDark } = useDarkMode();

  return (
    <SonnerToaster
      position="top-center"
      theme={isDark ? 'dark' : 'light'}
      // Keeps toasts clear of the notch on phones and the top bar on desktop.
      offset="calc(env(safe-area-inset-top, 0px) + 12px)"
      gap={10}
      duration={4500}
      toastOptions={{
        classNames: {
          toast:
            'rounded-2xl border border-ink/[0.07] bg-white/95 backdrop-blur-ios shadow-lifted ' +
            'dark:border-white/[0.1] dark:bg-[#1b201e]/95',
          title: 'text-[14px] font-medium text-ink dark:text-sand-100',
          description: 'text-[13px] text-ink-muted dark:text-sand-400 mt-0.5',
        },
      }}
      icons={{
        success: <CheckCircle2 size={18} className="text-brand-600" />,
        error: <XCircle size={18} className="text-red-500" />,
        warning: <AlertCircle size={18} className="text-amber-500" />,
        info: <Info size={18} className="text-sky-500" />,
      }}
    />
  );
}

export const toast = {
  success: (title: string, description?: string) =>
    sonnerToast.success(title, { description }),
  error: (title: string, description?: string) =>
    sonnerToast.error(title, { description }),
  info: (title: string, description?: string) =>
    sonnerToast.info(title, { description }),
  warning: (title: string, description?: string) =>
    sonnerToast.warning(title, { description }),
  dismiss: sonnerToast.dismiss,
};
