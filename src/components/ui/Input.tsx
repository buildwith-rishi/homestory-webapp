import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const inputBaseStyles =
      'h-12 w-full px-4 font-body text-body text-secondary bg-white rounded-md transition-all duration-200 placeholder:text-ash focus:outline-none disabled:bg-ash/20 disabled:cursor-not-allowed disabled:text-ash';

    const inputBorderStyles = hasError
      ? 'border-2 border-burgundy focus:border-burgundy'
      : 'border border-ash focus:border-2 focus:border-primary focus:px-[15px]';

    const inputWithIconStyles = prefixIcon ? 'pl-11' : suffixIcon ? 'pr-11' : '';

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 font-body font-medium text-body-sm text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefixIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ash flex items-center">
              {prefixIcon}
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            className={`${inputBaseStyles} ${inputBorderStyles} ${inputWithIconStyles}`}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ash flex items-center">
              {suffixIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            className="mt-2 font-body text-body-sm text-burgundy"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-2 font-body text-body-sm text-ash">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
