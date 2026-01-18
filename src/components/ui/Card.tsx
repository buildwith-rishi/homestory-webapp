import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'flat' | 'bordered' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'bordered',
  padding = 'md',
  radius = 'md',
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white transition-all duration-200';

  const variantStyles = {
    flat: '',
    bordered: 'border border-ash',
    elevated: 'shadow-brand-sm',
  };

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const radiusStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
  };

  const hoverStyles = hoverable
    ? 'hover:-translate-y-0.5 hover:shadow-brand-md cursor-pointer'
    : '';

  return (
    <motion.div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${radiusStyles[radius]} ${hoverStyles} ${className}`}
      whileHover={hoverable ? { y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
