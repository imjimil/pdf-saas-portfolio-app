import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-glow hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600/50',
  secondary:
    'bg-white text-ink ring-1 ring-inset ring-ink/[0.09] hover:bg-sand-50 active:bg-sand-100 dark:bg-white/[0.06] dark:text-sand-100 dark:ring-white/[0.1] dark:hover:bg-white/[0.1]',
  ghost:
    'text-ink-soft hover:bg-ink/[0.05] active:bg-ink/[0.08] dark:text-sand-300 dark:hover:bg-white/[0.07]',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-600/50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px]',
  md: 'h-11 gap-2 px-5 text-[15px]',
  lg: 'h-13 gap-2.5 px-7 text-base',
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const base =
  'relative inline-flex select-none items-center justify-center rounded-full font-medium ' +
  'transition-[transform,background-color,box-shadow] duration-200 ease-ios ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60';

function content({
  loading,
  icon: Icon,
  iconRight: IconRight,
  size = 'md',
  children,
}: BaseProps) {
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 19 : 17;

  return (
    <>
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" aria-hidden />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden />
      )}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden />}
    </>
  );
}

export type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

// `icon`, `iconRight` and `loading` are destructured out rather than left in
// `rest`, because anything still in `rest` is spread onto the DOM node and React
// warns about attributes it does not recognise.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      icon,
      iconRight,
      fullWidth,
      className,
      disabled,
      children,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {content({ icon, iconRight, size, loading, children })}
    </button>
  )
);
Button.displayName = 'Button';

export type ButtonLinkProps = BaseProps & { to: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof BaseProps
  >;

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconRight,
  fullWidth,
  className,
  to,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {content({ icon, iconRight, size, loading, children })}
    </Link>
  );
}
