import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'gradient';
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  variant = 'default',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-2 bg-ash rounded-full overflow-hidden">
        <motion.div
          className={
            variant === 'gradient'
              ? 'h-full bg-gradient-to-r from-primary to-rose rounded-full'
              : 'h-full bg-primary rounded-full'
          }
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="mt-2 text-right font-body text-body-sm text-secondary">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default Progress;
