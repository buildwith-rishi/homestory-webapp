import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-body font-medium rounded-full whitespace-nowrap';

  const variantStyles = {
    success: 'bg-olive/20 text-olive',
    warning: 'bg-rose/20 text-[#A86B5B]',
    error: 'bg-burgundy/20 text-burgundy',
    info: 'bg-teal/20 text-teal',
    neutral: 'bg-ash/30 text-secondary',
  };

  const sizeStyles = {
    sm: 'h-5 px-2 text-caption',
    md: 'h-6 px-3 text-body-sm',
    lg: 'h-7 px-4 text-body-sm',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
