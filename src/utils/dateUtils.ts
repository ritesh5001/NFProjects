export function formatDate(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysUntil(epoch: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(epoch);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(epoch: number): boolean {
  return daysUntil(epoch) < 0;
}

export function isDueThisWeek(epoch: number): boolean {
  const d = daysUntil(epoch);
  return d >= 0 && d <= 7;
}

export function deadlineLabel(epoch: number): string {
  const d = daysUntil(epoch);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `${d}d left`;
}
