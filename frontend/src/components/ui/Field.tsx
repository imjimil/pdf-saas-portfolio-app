import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Form primitives for tool options.
 *
 * Every control owns its own generated id so pages never have to invent one,
 * and each keeps a 44px hit area even where the visible box is smaller.
 */

const inputBase =
  'h-11 w-full rounded-xl border hairline bg-white px-3.5 text-[15px] text-ink ' +
  'placeholder:text-ink-muted/70 transition-colors ' +
  'dark:bg-white/[0.04] dark:text-sand-100 dark:placeholder:text-sand-400/60 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const labelBase = 'block text-[13.5px] font-medium text-ink-soft dark:text-sand-200';
const helperBase = 'text-[12.5px] text-muted';
const errorBase = 'text-[12.5px] font-medium text-red-600 dark:text-red-400';

/** Selectable surfaces share this look so cards and segments feel related. */
const selectedSurface =
  'border-brand-500 bg-brand-500/[0.07] dark:border-brand-400/70 dark:bg-brand-500/[0.12]';
const unselectedSurface =
  'border-ink/[0.09] bg-white hover:border-ink/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:border-white/25';

const focusRingViaPeer =
  'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ' +
  'peer-focus-visible:ring-offset-sand-50 dark:peer-focus-visible:ring-offset-[#0b0f0e]';

function describedBy(id: string, helper?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (helper) return `${id}-helper`;
  return undefined;
}

function Caption({ id, helper, error }: { id: string; helper?: string; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className={errorBase}>
        {error}
      </p>
    );
  }
  if (helper) {
    return (
      <p id={`${id}-helper`} className={helperBase}>
        {helper}
      </p>
    );
  }
  return null;
}

// --- Text and number ---------------------------------------------------------

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'value' | 'onChange' | 'type'
>;

export interface TextFieldProps extends NativeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  error?: string;
  type?: 'text' | 'password' | 'email';
  /** Rendered inside the input, e.g. a show/hide password button. */
  trailing?: ReactNode;
}

export function TextField({
  label,
  value,
  onChange,
  helper,
  error,
  type = 'text',
  trailing,
  ...rest
}: TextFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelBase}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, helper, error)}
          className={cn(
            inputBase,
            trailing && 'pr-12',
            error && 'border-red-400 dark:border-red-500/60'
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>
      <Caption id={id} helper={helper} error={error} />
    </div>
  );
}

export interface NumberFieldProps
  extends Omit<NativeInputProps, 'min' | 'max' | 'step'> {
  label: string;
  /** Kept as a string so the field can legitimately be empty. */
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  helper,
  error,
  min,
  max,
  step,
  ...rest
}: NumberFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelBase}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helper, error)}
        className={cn(inputBase, error && 'border-red-400 dark:border-red-500/60')}
        {...rest}
      />
      <Caption id={id} helper={helper} error={error} />
    </div>
  );
}

// --- Select ------------------------------------------------------------------

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  helper?: string;
  disabled?: boolean;
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  helper,
  disabled,
}: SelectFieldProps<T>) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelBase}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          aria-describedby={describedBy(id, helper)}
          className={cn(inputBase, 'appearance-none pr-10')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={17}
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-sand-400"
        />
      </div>
      <Caption id={id} helper={helper} />
    </div>
  );
}

// --- Switch and checkbox -----------------------------------------------------

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
  disabled,
}: ToggleProps) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <label htmlFor={id} className={cn(labelBase, 'cursor-pointer')}>
          {label}
        </label>
        {description && <span className={cn(helperBase, 'mt-0.5 block')}>{description}</span>}
      </span>

      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={cn(
          'tap-target -my-2 flex shrink-0 cursor-pointer items-center justify-end',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span
          className={cn(
            'relative block h-[30px] w-[50px] rounded-full transition-colors duration-200 ease-ios',
            checked ? 'bg-brand-600' : 'bg-ink/[0.15] dark:bg-white/[0.18]',
            focusRingViaPeer
          )}
        >
          <span
            className={cn(
              'absolute left-0 top-[3px] block h-6 w-6 rounded-full bg-white shadow-card transition-transform duration-200 ease-ios',
              checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
            )}
          />
        </span>
      </label>
    </div>
  );
}

export interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  description,
  disabled,
}: CheckboxFieldProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-[44px] cursor-pointer items-center gap-3 py-1',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border transition-colors duration-150',
          checked
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-ink/20 bg-white dark:border-white/25 dark:bg-white/[0.04]',
          focusRingViaPeer
        )}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className={labelBase}>{label}</span>
        {description && <span className={cn(helperBase, 'mt-0.5 block')}>{description}</span>}
      </span>
    </label>
  );
}

// --- Range -------------------------------------------------------------------

export interface RangeFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  helper?: string;
  /** Defaults to the raw number. */
  format?: (value: number) => string;
  disabled?: boolean;
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  helper,
  format,
  disabled,
}: RangeFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelBase}>
          {label}
        </label>
        <span className="text-[13px] font-medium tabular-nums text-ink dark:text-sand-100">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-describedby={describedBy(id, helper)}
        className={cn(
          'h-11 w-full cursor-pointer accent-brand-600',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      />
      <Caption id={id} helper={helper} />
    </div>
  );
}

// --- Radio cards -------------------------------------------------------------

export interface RadioCardOption<T extends string> {
  value: T;
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export interface RadioCardsProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<RadioCardOption<T>>;
  helper?: string;
  /** Two columns from the `sm` breakpoint up. */
  columns?: 1 | 2;
}

export function RadioCards<T extends string>({
  label,
  value,
  onChange,
  options,
  helper,
  columns = 1,
}: RadioCardsProps<T>) {
  const name = useId();

  return (
    <fieldset>
      <legend className={cn(labelBase, 'mb-2')}>{label}</legend>
      <div className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2')}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;

          return (
            <label key={option.value} className="relative block">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'flex min-h-[56px] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors duration-150',
                  active ? selectedSurface : unselectedSurface,
                  focusRingViaPeer
                )}
              >
                {Icon && (
                  <Icon
                    size={19}
                    aria-hidden
                    className={cn(
                      'mt-0.5 shrink-0',
                      active
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-ink-muted dark:text-sand-400'
                    )}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-[14.5px] font-medium',
                      active
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-ink dark:text-sand-100'
                    )}
                  >
                    {option.title}
                  </span>
                  {option.description && (
                    <span className={cn(helperBase, 'mt-0.5 block text-pretty')}>
                      {option.description}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 grid h-[20px] w-[20px] shrink-0 place-items-center rounded-full border transition-colors',
                    active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink/20 dark:border-white/25'
                  )}
                >
                  {active && <Check size={13} strokeWidth={3} />}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {helper && <p className={cn(helperBase, 'mt-2')}>{helper}</p>}
    </fieldset>
  );
}

// --- Segmented control -------------------------------------------------------

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentOption<T>>;
  helper?: string;
  /** Hides the visible label while keeping it for screen readers. */
  hideLabel?: boolean;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  helper,
  hideLabel,
}: SegmentedControlProps<T>) {
  const name = useId();
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  return (
    <fieldset>
      <legend className={cn(labelBase, hideLabel ? 'sr-only' : 'mb-2')}>{label}</legend>

      <div className="relative flex rounded-full bg-ink/[0.05] p-1 dark:bg-white/[0.06]">
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-full bg-white shadow-card transition-transform duration-300 ease-ios dark:bg-white/[0.14]"
          style={{
            width: `calc((100% - 0.5rem) / ${options.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;

          return (
            <label key={option.value} className="relative z-10 min-w-0 flex-1">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 text-center text-[14px] font-medium transition-colors duration-200',
                  active
                    ? 'text-ink dark:text-sand-100'
                    : 'text-ink-muted hover:text-ink-soft dark:text-sand-400 dark:hover:text-sand-200',
                  focusRingViaPeer
                )}
              >
                {Icon && <Icon size={16} aria-hidden className="shrink-0" />}
                <span className="truncate">{option.label}</span>
              </span>
            </label>
          );
        })}
      </div>

      {helper && <p className={cn(helperBase, 'mt-2')}>{helper}</p>}
    </fieldset>
  );
}
