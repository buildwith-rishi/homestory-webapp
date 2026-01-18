import React from 'react';
import { motion } from 'framer-motion';

export interface LogoProps {
  variant?: 'full' | 'mark' | 'type';
  colorScheme?: 'default' | 'light' | 'mono-white' | 'mono-dark';
  size?: number;
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  colorScheme = 'default',
  size = 130,
  animated = false,
  className = '',
}) => {
  const colorSchemes = {
    default: {
      mark: '#DC5800',
      text: '#321300',
    },
    light: {
      mark: '#DC5800',
      text: '#FFFFFF',
    },
    'mono-white': {
      mark: '#FFFFFF',
      text: '#FFFFFF',
    },
    'mono-dark': {
      mark: '#321300',
      text: '#321300',
    },
  };

  const colors = colorSchemes[colorScheme];
  const markSize = variant === 'mark' ? size : size * 0.3;
  const textHeight = markSize * 0.8;

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      },
    },
  };

  const squareVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.6,
      },
    },
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {(variant === 'full' || variant === 'mark') && (
        <motion.svg
          width={markSize}
          height={markSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          whileHover={animated ? { rotate: 5 } : undefined}
          transition={{ duration: 0.3 }}
        >
          <motion.path
            d="M 0 50 Q 0 0 50 0"
            stroke={colors.mark}
            strokeWidth="0"
            fill={colors.mark}
            variants={animated ? pathVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
          />
          <motion.rect
            x="50"
            y="0"
            width="50"
            height="50"
            fill={colors.mark}
            variants={animated ? squareVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
          />
          <motion.rect
            x="0"
            y="50"
            width="50"
            height="50"
            fill={colors.mark}
            variants={animated ? squareVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
          />
          <motion.path
            d="M 100 50 Q 100 100 50 100"
            stroke={colors.mark}
            strokeWidth="0"
            fill={colors.mark}
            variants={animated ? pathVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
          />
        </motion.svg>
      )}

      {(variant === 'full' || variant === 'type') && (
        <div className="flex flex-col leading-none">
          <motion.span
            className="font-display font-medium"
            style={{
              fontSize: textHeight * 0.6,
              color: colors.text,
              lineHeight: 0.9,
            }}
            initial={animated ? { opacity: 0, x: -10 } : undefined}
            animate={animated ? { opacity: 1, x: 0 } : undefined}
            transition={animated ? { delay: 0.8, duration: 0.4 } : undefined}
          >
            Good
          </motion.span>
          <motion.span
            className="font-display font-medium"
            style={{
              fontSize: textHeight * 0.6,
              color: colors.text,
              lineHeight: 0.9,
            }}
            initial={animated ? { opacity: 0, x: -10 } : undefined}
            animate={animated ? { opacity: 1, x: 0 } : undefined}
            transition={animated ? { delay: 0.9, duration: 0.4 } : undefined}
          >
            Homestory
          </motion.span>
        </div>
      )}
    </div>
  );
};

export default Logo;
