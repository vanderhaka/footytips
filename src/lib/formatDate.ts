export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Date TBC';
  return new Date(dateString).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}
