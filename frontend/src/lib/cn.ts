import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes so a caller's `className` reliably overrides a
 * component's defaults instead of both landing in the DOM and fighting.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
