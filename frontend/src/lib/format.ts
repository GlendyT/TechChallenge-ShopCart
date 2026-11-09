export function formatDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) throw new RangeError(`Invalid date: ${value}`);
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(value)
}
