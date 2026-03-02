import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'brand' | 'white' | 'muted' | 'current';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, { dim: number; stroke: number }> = {
  xs: { dim: 12, stroke: 1.8 },
  sm: { dim: 16, stroke: 2 },
  md: { dim: 24, stroke: 2.5 },
  lg: { dim: 32, stroke: 2.5 },
  xl: { dim: 48, stroke: 3 },
};

const colorMap: Record<SpinnerColor, string> = {
  brand:   'text-primary',
  white:   'text-white',
  muted:   'text-gray-400',
  current: '',
};

const Spinner: React.FC<SpinnerProps> = ({
  size  = 'md',
  color = 'brand',
  label = 'Loading…',
  className = '',
}) => {
  const { dim, stroke } = sizeMap[size];
  const cx = dim / 2;
  // radius sits just inside the stroke
  const r = cx - stroke;
  const circumference = 2 * Math.PI * r;
  // 75% of circumference forms the spinning arc
  const arc = circumference * 0.75;
  const gap = circumference * 0.25;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      className={`animate-spin-smooth shrink-0 ${colorMap[color]} ${className}`}
      aria-hidden="true"
      role="status"
      fill="none"
    >
      {label && <title>{label}</title>}
      {/* Track ring */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        opacity="0.15"
      />
      {/* Moving arc – starts from 12 o'clock via rotate(-90) */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${gap}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  );
};

export default Spinner;
