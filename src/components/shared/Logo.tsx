import React from "react";
import { motion } from "framer-motion";

export interface LogoProps {
  variant?: "full" | "mark" | "type";
  colorScheme?: "default" | "light" | "mono-white" | "mono-dark";
  size?: number;
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = "full",
  colorScheme = "default",
  size = 180,
  animated = false,
  className = "",
}) => {
  // Calculate height based on the logo's aspect ratio (approximately 2.7:1 for the full logo)
  const logoHeight = variant === "mark" ? size : size * 0.37;
  const logoWidth = variant === "mark" ? size : size;

  // For mark variant, show only icon (cropped from full logo)
  if (variant === "mark") {
    return (
      <motion.div
        className={`inline-flex items-center justify-center ${className}`}
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={animated ? { duration: 0.6 } : undefined}
        whileHover={animated ? { scale: 1.05 } : undefined}
      >
        <img
          src="/logo.png"
          alt="Good Homestory"
          style={{
            width: "auto",
            height: size,
            objectFit: "contain",
            objectPosition: "left center",
            maxHeight: size,
            filter:
              colorScheme === "light" ? "brightness(0) invert(1)" : "none",
          }}
          className="max-w-[120px]"
        />
      </motion.div>
    );
  }

  // For full or type variant, show complete logo
  return (
    <motion.div
      className={`inline-flex items-center ${className}`}
      initial={animated ? { opacity: 0 } : undefined}
      animate={animated ? { opacity: 1 } : undefined}
      transition={animated ? { duration: 0.6 } : undefined}
      whileHover={animated ? { scale: 1.02 } : undefined}
    >
      <img
        src="/logo.png"
        alt="Good Homestory"
        style={{
          width: "auto",
          height: "auto",
          maxWidth: logoWidth,
          maxHeight: logoHeight * 1.5,
          display: "block",
          objectFit: "contain",
          filter: colorScheme === "light" ? "brightness(0) invert(1)" : "none",
        }}
      />
    </motion.div>
  );
};

export default Logo;
