import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const hasError = !!error;

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
        setIsOpen(false);
      }
    };

    const triggerBaseStyles =
      'h-12 w-full px-4 font-body text-body text-secondary bg-white rounded-md transition-all duration-200 cursor-pointer flex items-center justify-between disabled:bg-ash/20 disabled:cursor-not-allowed disabled:text-ash';

    const triggerBorderStyles = hasError
      ? 'border-2 border-burgundy'
      : isOpen
      ? 'border-2 border-primary px-[15px]'
      : 'border border-ash';

    return (
      <div ref={ref} className={`w-full ${className}`}>
        {label && (
          <label className="block mb-2 font-body font-medium text-body-sm text-secondary">
            {label}
          </label>
        )}
        <div ref={selectRef} className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`${triggerBaseStyles} ${triggerBorderStyles}`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={selectedOption ? 'text-secondary' : 'text-ash'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              size={20}
              className={`text-ash transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-2 bg-white border border-ash rounded-md shadow-brand-lg overflow-hidden"
                role="listbox"
              >
                <div className="max-h-60 overflow-y-auto">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={`w-full px-4 py-3 font-body text-body text-left flex items-center justify-between transition-colors duration-150 ${
                        option.disabled
                          ? 'text-ash cursor-not-allowed'
                          : 'text-secondary hover:bg-primary/10 cursor-pointer'
                      } ${option.value === value ? 'bg-primary/5' : ''}`}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      <span>{option.label}</span>
                      {option.value === value && <Check size={18} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {error && (
          <motion.p
            className="mt-2 font-body text-body-sm text-burgundy"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {!error && helperText && (
          <p className="mt-2 font-body text-body-sm text-ash">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
