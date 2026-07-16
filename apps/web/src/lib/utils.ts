/**
 * @module lib/utils
 *
 * Cross-cutting UI helpers shared by every component.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class name fragments and resolve Tailwind class
 * conflicts (last-wins), the standard shadcn/ui helper.
 *
 * @param inputs - Class name fragments, arrays, or conditional objects.
 * @returns The merged class name string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
