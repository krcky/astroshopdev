import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Spaja Tailwind klase i resava konflikte (poslednja pobedjuje). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
