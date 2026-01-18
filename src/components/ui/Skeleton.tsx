import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const baseStyles = 'bg-ash/30 animate-pulse';

  const variantStyles = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-md',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'circle' ? '40px' : variant === 'rectangle' ? '100px' : '1rem'),
  };

  return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} style={style} />;
};

export default Skeleton;
