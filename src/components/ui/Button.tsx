import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-body font-medium transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-[#C24F00] active:bg-[#A94400] disabled:bg-ash disabled:opacity-50",
      secondary:
        "bg-white text-secondary border border-secondary/70 hover:bg-secondary hover:text-white active:bg-[#1F0C00] disabled:border-ash disabled:text-ash disabled:opacity-50",
      ghost:
        "bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20 disabled:text-ash disabled:opacity-50",
      danger:
        "bg-burgundy text-white hover:bg-[#4D0A14] active:bg-[#3B0810] disabled:bg-ash disabled:opacity-50",
    };

    const sizeStyles = {
      sm: "h-9 px-4 text-body-sm rounded-md gap-2",
      md: "h-11 px-5 text-body rounded-md gap-2",
      lg: "h-14 px-7 text-body rounded-md gap-3",
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <motion.button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        {...props}
      >
        {loading && (
          <Loader2
            className="animate-spin"
            size={size === "sm" ? 14 : size === "lg" ? 18 : 16}
          />
        )}
        {!loading && leftIcon && (
          <span className="flex items-center">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="flex items-center">{rightIcon}</span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

export default Button;
