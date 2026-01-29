import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showText, setShowText] = useState(false);
  
  useEffect(() => {
    // Trigger text animation on mount
    const timer = setTimeout(() => setShowText(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Calculate dimensions based on variant - reduced for professional look
  const iconSize = variant === "mark" ? size : size * 0.22;
  const fontSize = variant === "mark" ? 0 : size * 0.095;

  // Text color based on color scheme
  const textColor =
    colorScheme === "light" || colorScheme === "mono-white"
      ? "#ffffff"
      : colorScheme === "mono-dark"
      ? "#1a1a1a"
      : "#1a1a1a";

  // Filter for icon based on color scheme
  const iconFilter =
    colorScheme === "light" || colorScheme === "mono-white"
      ? "brightness(0) invert(1)"
      : "none";

  const text1 = "Good";
  const text2 = "Homestory";

  // Animation variants for letters
  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // For mark variant, show only the icon
  if (variant === "mark") {
    return (
      <motion.div
        className={`inline-flex items-center justify-center ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <img
          src="/logo2.png"
          alt="Good Homestory"
          style={{
            width: iconSize,
            height: iconSize,
            objectFit: "contain",
            filter: iconFilter,
          }}
        />
      </motion.div>
    );
  }

  // For full variant, show icon + text stacked vertically with letter animation
  return (
    <motion.div
      className={`inline-flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.img
        src="/logo2.png"
        alt="Good Homestory Icon"
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: "contain",
          flexShrink: 0,
          filter: iconFilter,
        }}
      />
      <div className="flex flex-col">
        <div
          style={{
            fontSize: fontSize,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            fontFamily: '"Neue Haas Grotesk Display Pro", "Helvetica Neue", "Arial", system-ui, -apple-system, sans-serif',
            color: textColor,
          }}
        >
          {showText &&
            text1.split("").map((char, index) => (
              <motion.span
                key={`good-${index}`}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            ))}
        </div>
        <div
          style={{
            fontSize: fontSize,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            fontFamily: '"Neue Haas Grotesk Display Pro", "Helvetica Neue", "Arial", system-ui, -apple-system, sans-serif',
            color: textColor,
          }}
        >
          {showText &&
            text2.split("").map((char, index) => (
              <motion.span
                key={`homestory-${index}`}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                transition={{
                  duration: 0.3,
                  delay: (text1.length * 0.05) + (index * 0.05),
                  ease: "easeOut",
                }}
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Logo;
