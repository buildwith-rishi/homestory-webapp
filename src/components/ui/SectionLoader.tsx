import React from 'react';
import Spinner, { SpinnerSize } from './Spinner';

export interface SectionLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizeMap: Record<'sm' | 'md' | 'lg', SpinnerSize> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

const paddingMap = {
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
};

const SectionLoader: React.FC<SectionLoaderProps> = ({
  message,
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${paddingMap[size]} ${className}`}
    >
      <Spinner size={spinnerSizeMap[size]} color="brand" />
      {message && (
        <p className="mt-4 text-sm text-gray-400 font-body">{message}</p>
      )}
    </div>
  );
};

export default SectionLoader;
