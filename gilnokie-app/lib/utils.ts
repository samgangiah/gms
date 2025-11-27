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
 * @param weight - Weight value (number or Decimal)
 * @returns Formatted weight string (e.g., "123.45 kg")
 */
export function formatWeight(weight: number | { toNumber: () => number }): string {
  const value = typeof weight === 'number' ? weight : weight.toNumber();
  return `${value.toFixed(2)} kg`;
}

/**
 * Format currency in South African Rand
 * @param amount - Amount value (number or Decimal)
 * @returns Formatted currency string (e.g., "R 1,234.56")
 */
export function formatCurrency(amount: number | { toNumber: () => number }): string {
  const value = typeof amount === 'number' ? amount : amount.toNumber();
  return `R ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
