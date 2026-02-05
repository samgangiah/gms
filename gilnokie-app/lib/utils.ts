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

// ============================================================================
// UNIT CONVERSION UTILITIES
// ============================================================================

type DecimalLike = number | string | { toNumber: () => number } | null | undefined;

/**
 * Convert a decimal-like value to a number
 */
function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return value.toNumber();
}

/**
 * Convert kilograms to meters using the fabric quality's conversion factor
 * @param kg - Weight in kilograms
 * @param metersPerKg - Conversion factor (meters per 1 kg)
 * @returns Meters equivalent, or null if conversion not possible
 */
export function kgToMeters(
  kg: DecimalLike,
  metersPerKg: DecimalLike
): number | null {
  const kgValue = toNumber(kg);
  const factor = toNumber(metersPerKg);
  if (factor <= 0) return null;
  return kgValue * factor;
}

/**
 * Convert meters to kilograms using the fabric quality's conversion factor
 * @param meters - Length in meters
 * @param metersPerKg - Conversion factor (meters per 1 kg)
 * @returns Kilograms equivalent, or null if conversion not possible
 */
export function metersToKg(
  meters: DecimalLike,
  metersPerKg: DecimalLike
): number | null {
  const metersValue = toNumber(meters);
  const factor = toNumber(metersPerKg);
  if (factor <= 0) return null;
  return metersValue / factor;
}

/**
 * Format weight with optional meters equivalent
 * @param kg - Weight in kilograms
 * @param metersPerKg - Optional conversion factor
 * @returns Formatted string like "123.45 kg (~308.6 m)" or "123.45 kg"
 */
export function formatWeightWithMeters(
  kg: DecimalLike,
  metersPerKg?: DecimalLike
): string {
  const kgValue = toNumber(kg);
  const baseFormat = `${kgValue.toFixed(2)} kg`;
  
  if (!metersPerKg) return baseFormat;
  
  const meters = kgToMeters(kgValue, metersPerKg);
  if (meters === null) return baseFormat;
  
  return `${baseFormat} (~${meters.toFixed(1)} m)`;
}

/**
 * Format meters with optional kg equivalent
 * @param meters - Length in meters
 * @param metersPerKg - Optional conversion factor
 * @returns Formatted string like "308.6 m (~123.45 kg)" or "308.6 m"
 */
export function formatMetersWithKg(
  meters: DecimalLike,
  metersPerKg?: DecimalLike
): string {
  const metersValue = toNumber(meters);
  const baseFormat = `${metersValue.toFixed(1)} m`;
  
  if (!metersPerKg) return baseFormat;
  
  const kg = metersToKg(metersValue, metersPerKg);
  if (kg === null) return baseFormat;
  
  return `${baseFormat} (~${kg.toFixed(2)} kg)`;
}
