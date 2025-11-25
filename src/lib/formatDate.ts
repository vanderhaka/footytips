/**
 * Format a date string for display in match listings.
 * Uses Australian locale and Melbourne timezone.
 */
export function formatMatchDateTime(dateString: string | null): string {
  if (!dateString) return 'Date TBC';

  return new Date(dateString).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Australia/Melbourne'
  });
}
