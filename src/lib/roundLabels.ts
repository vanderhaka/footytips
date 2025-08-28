export function getRoundLabel(roundNum: number): string {
  switch (roundNum) {
    case 26:
      return 'Finals Week 1';
    case 27:
      return 'Finals Week 2';
    case 28:
      return 'Preliminary Finals';
    case 29:
      return 'Grand Final';
    default:
      return `Round ${roundNum}`;
  }
}

