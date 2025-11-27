import { Decimal } from '@prisma/client/runtime/library';

export function formatWeight(weight: number | Decimal): string {
  const w = typeof weight === 'number' ? weight : weight.toNumber();
  return `${w.toFixed(2)} kg`;
}

export function formatCurrency(amount: number | Decimal): string {
  const a = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(a);
}

export function formatPercentage(value: number | Decimal): string {
  const v = typeof value === 'number' ? value : value.toNumber();
  return `${v.toFixed(1)}%`;
}

export function formatQuantity(qty: number | Decimal, unit: string = ''): string {
  const q = typeof qty === 'number' ? qty : qty.toNumber();
  return `${q.toLocaleString('en-ZA')}${unit ? ' ' + unit : ''}`;
}
