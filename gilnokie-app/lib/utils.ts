import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Jan 12, 2025")
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format weight in kilograms
 * @param weight - Weight value (number, string, or Decimal)
 * @returns Formatted weight string (e.g., "123.45 kg")
 */
export function formatWeight(weight: number | string | { toNumber: () => number } | null | undefined): string {
  if (weight === null || weight === undefined) return '0.00 kg';
  let value: number;
  if (typeof weight === 'number') {
    value = weight;
  } else if (typeof weight === 'string') {
    value = parseFloat(weight) || 0;
  } else {
    value = weight.toNumber();
  }
  return `${value.toFixed(2)} kg`;
}

/**
 * Format currency in South African Rand
 * @param amount - Amount value (number, string, or Decimal)
 * @returns Formatted currency string (e.g., "R 1,234.56")
 */
export function formatCurrency(amount: number | string | { toNumber: () => number } | null | undefined): string {
  if (amount === null || amount === undefined) return 'R 0.00';
  let value: number;
  if (typeof amount === 'number') {
    value = amount;
  } else if (typeof amount === 'string') {
    value = parseFloat(amount) || 0;
  } else {
    value = amount.toNumber();
  }
  return `R ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
