import React from 'react';
import { motion } from 'framer-motion';

export interface BrandPatternProps {
  opacity?: number;
  color?: 'orange' | 'dark-brown' | 'white';
  scale?: number;
  animated?: boolean;
  className?: string;
}

const BrandPattern: React.FC<BrandPatternProps> = ({
  opacity = 0.05,
  color = 'orange',
  scale = 1,
  animated = false,
  className = '',
}) => {
  const colors = {
    orange: '#DC5800',
    'dark-brown': '#321300',
    white: '#FFFFFF',
  };

  const patternColor = colors[color];
  const patternSize = 80 * scale;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          animated
            ? {
                y: [0, -patternSize],
                transition: {
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }
            : undefined
        }
      >
        <defs>
          <pattern
            id="brand-pattern"
            x="0"
            y="0"
            width={patternSize}
            height={patternSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M 0 ${patternSize / 2} Q 0 0 ${patternSize / 2} 0`}
              fill={patternColor}
              opacity={opacity}
            />
            <rect
              x={patternSize / 2}
              y="0"
              width={patternSize / 2}
              height={patternSize / 2}
              fill={patternColor}
              opacity={opacity}
            />
            <rect
              x="0"
              y={patternSize / 2}
              width={patternSize / 2}
              height={patternSize / 2}
              fill={patternColor}
              opacity={opacity}
            />
            <path
              d={`M ${patternSize} ${patternSize / 2} Q ${patternSize} ${patternSize} ${
                patternSize / 2
              } ${patternSize}`}
              fill={patternColor}
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#brand-pattern)" />
      </motion.svg>
    </div>
  );
};

export default BrandPattern;
