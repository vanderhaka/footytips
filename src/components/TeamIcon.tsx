interface TeamIconProps {
  abbreviation: string;
  size?: 'sm' | 'md' | 'lg';
}

type Split = 'diagonal' | 'vertical' | 'horizontal' | 'conic' | 'chevron';

interface TeamConfig {
  colors: string[];
  split: Split;
}

const TEAMS: Record<string, TeamConfig> = {
  // 3-color horizontal (rows: top/mid/bottom)
  ADL: { colors: ['#002B5C', '#E21937', '#FDB827'], split: 'horizontal' },
  GEE: { colors: ['#001F3D', '#FFFFFF', '#001F3D'], split: 'horizontal' },
  WB:  { colors: ['#003DA5', '#FFFFFF', '#ED1C24'], split: 'horizontal' },
  // 3-color vertical (columns: left/mid/right)
  COL: { colors: ['#000000', '#FFFFFF', '#000000'], split: 'vertical' },
  HAW: { colors: ['#4D2004', '#FBBF24', '#4D2004'], split: 'vertical' },
  NM:  { colors: ['#003F87', '#FFFFFF', '#003F87'], split: 'vertical' },
  STK: { colors: ['#ED1C24', '#FFFFFF', '#000000'], split: 'vertical' },
  BRL: { colors: ['#A30046', '#0033A0', '#FFCC00'], split: 'vertical' },
  PA:  { colors: ['#008AAB', '#FFFFFF', '#000000'], split: 'vertical' },
  // 2-color teams
  GC:  { colors: ['#D50032', '#FFD200'], split: 'horizontal' },
  ESS: { colors: ['#000000', '#CC0000', '#000000'], split: 'diagonal' },
  FRE: { colors: ['#2A0D54', '#FFFFFF'], split: 'chevron' },
  GWS: { colors: ['#F47920', '#424242'], split: 'vertical' },
  MEL: { colors: ['#002855', '#CC0000'], split: 'chevron' },
  RIC: { colors: ['#000000', '#FDE100', '#000000'], split: 'diagonal' },
  SYD: { colors: ['#ED1C24', '#FFFFFF'], split: 'chevron' },
  WC:  { colors: ['#003DA5', '#FFD200'], split: 'chevron' },
  // 1-color teams
  CAR: { colors: ['#001F3D'], split: 'diagonal' },
};

const SIZES = { sm: 24, md: 32, lg: 40 };

const V = 100;
const C = V / 2;
const R = V / 2;

function arcX(deg: number) { return C + R * Math.sin((deg * Math.PI) / 180); }
function arcY(deg: number) { return C - R * Math.cos((deg * Math.PI) / 180); }

function slice(startDeg: number, endDeg: number): string {
  let sweep = endDeg - startDeg;
  if (sweep < 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;
  return `M${C},${C}L${arcX(startDeg)},${arcY(startDeg)}A${R},${R} 0 ${large} 1 ${arcX(endDeg)},${arcY(endDeg)}Z`;
}

export function TeamIcon({ abbreviation, size = 'md' }: TeamIconProps) {
  const team = TEAMS[abbreviation] || { colors: ['#6B7280'], split: 'diagonal' as Split };
  const { colors, split } = team;
  const dim = SIZES[size];
  const clipId = `tc-${abbreviation}`;

  const needsClip = (colors.length === 3 && split !== 'conic') || split === 'chevron';

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${V} ${V}`}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    >
      {needsClip && (
        <defs>
          <clipPath id={clipId}>
            <circle cx={C} cy={C} r={R} />
          </clipPath>
        </defs>
      )}

      {colors.length === 1 ? (
        <circle cx={C} cy={C} r={R} fill={colors[0]} />
      ) : split === 'chevron' ? (
        <g clipPath={`url(#${clipId})`}>
          <circle cx={C} cy={C} r={R} fill={colors[0]} />
          <path d={`M0,0 L${C},${C * 1.2} L${V},0 Z`} fill={colors[1]} />
        </g>
      ) : colors.length === 2 ? (
        <>
          <circle cx={C} cy={C} r={R} fill={colors[1]} />
          <path d={
            split === 'vertical'   ? slice(180, 0) :
            split === 'horizontal' ? slice(270, 90) :
            slice(315, 135)
          } fill={colors[0]} />
        </>
      ) : split === 'horizontal' ? (
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width={V} height="34" fill={colors[0]} />
          <rect x="0" y="33" width={V} height="34" fill={colors[1]} />
          <rect x="0" y="66" width={V} height="34" fill={colors[2]} />
        </g>
      ) : split === 'vertical' ? (
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="34" height={V} fill={colors[0]} />
          <rect x="33" y="0" width="34" height={V} fill={colors[1]} />
          <rect x="66" y="0" width="34" height={V} fill={colors[2]} />
        </g>
      ) : split === 'diagonal' && colors.length === 3 ? (
        <g clipPath={`url(#${clipId})`}>
          <g transform={`rotate(-45, ${C}, ${C})`}>
            <rect x="-25" y="-25" width="150" height="50" fill={colors[0]} />
            <rect x="-25" y="24" width="150" height="52" fill={colors[1]} />
            <rect x="-25" y="75" width="150" height="50" fill={colors[2]} />
          </g>
        </g>
      ) : (
        <>
          <circle cx={C} cy={C} r={R} fill={colors[2]} />
          <path d={slice(210, 330)} fill={colors[0]} />
          <path d={slice(330, 90)} fill={colors[1]} />
        </>
      )}

      <circle cx={C} cy={C} r={C - 1} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
    </svg>
  );
}
