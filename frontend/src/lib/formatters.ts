/**
 * Format number in Indian numbering system (lakhs and crores)
 * Example: 12345678 -> 1,23,45,678
 */
export function formatIndianCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  
  const numStr = Math.round(value).toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  
  return lastThree;
}

/**
 * Format number in standard locale format
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString();
}
