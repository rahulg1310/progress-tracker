// Shared time/date helpers for the AI features.

// 270 -> "4h 30m", 45 -> "45m", 120 -> "2h"
export const formatMinutes = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Local calendar date as "YYYY-MM-DD" (toISOString() would shift the day in IST)
export const toDateKey = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// "2026-10-18" -> Date at local midnight
export const fromDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// "2026-10-18" -> "Oct 18"
export const formatShortDate = (dateKey) => {
  return fromDateKey(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ISO timestamp -> "6:42 PM"
export const formatClock = (iso) => {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ISO timestamp or "YYYY-MM-DD" -> "Today" / "Yesterday" / "Oct 12"
export const formatRelativeDay = (iso) => {
  const todayKey = toDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : toDateKey(iso);
  if (key === todayKey) return 'Today';
  if (key === toDateKey(yesterday)) return 'Yesterday';
  return formatShortDate(key);
}

export const daysBetween = (fromKey, toKey) => {
  const ms = fromDateKey(toKey).getTime() - fromDateKey(fromKey).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}
