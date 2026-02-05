export function getRoundLabel(roundNum: number): string {
  switch (roundNum) {
    case 0:
      return 'Opening Round';
    case 25:
      return 'Wildcard Round';
    case 26:
      return 'Finals Week 1';
    case 27:
      return 'Semi Finals';
    case 28:
      return 'Preliminary Finals';
    case 29:
      return 'Grand Final';
    default:
      return `Round ${roundNum}`;
  }
}
