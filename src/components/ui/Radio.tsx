import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`flex items-center ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={radioId}
            className="flex items-center justify-center w-5 h-5 border-2 border-ash rounded-full cursor-pointer transition-all duration-200 peer-checked:border-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
          >
            <motion.div
              className="w-[6px] h-[6px] rounded-full bg-white"
              initial={{ scale: 0 }}
              animate={props.checked ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
            {props.checked && (
              <div className="absolute inset-0 bg-primary rounded-full -z-10" />
            )}
          </label>
        </div>
        {label && (
          <label
            htmlFor={radioId}
            className="ml-3 font-body text-body-sm text-secondary cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
