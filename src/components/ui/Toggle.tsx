import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`flex items-center ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={toggleId}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={toggleId}
            className="flex items-center w-11 h-6 bg-ash rounded-full cursor-pointer transition-all duration-200 peer-checked:bg-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full shadow-brand-sm"
              initial={false}
              animate={{
                x: props.checked ? 22 : 2,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
            />
          </label>
        </div>
        {label && (
          <label
            htmlFor={toggleId}
            className="ml-3 font-body text-body-sm text-secondary cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
