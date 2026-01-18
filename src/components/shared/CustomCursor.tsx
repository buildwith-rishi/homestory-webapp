import { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import gsap from 'gsap';

const CustomCursor: React.FC = () => {
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorX = useSpring(0, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 500, damping: 28 });
  const [isHovering, setIsHovering] = useState(false);
  const [cursorType, setCursorType] = useState<'default' | 'link' | 'image'>('default');

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;

      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('a')) {
        setIsHovering(true);
        setCursorType('link');
        setCursorText('Click');
      } else if (target.tagName === 'IMG' || target.classList.contains('hoverable-image')) {
        setIsHovering(true);
        setCursorType('image');
        setCursorText('Explore');
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setCursorType('default');
      setCursorText('');
    };

    window.addEventListener('mousemove', handleMouseMove);

    const interactiveElements = document.querySelectorAll('a, button, img, .hoverable-image');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <motion.div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <motion.div
        animate={{
          width: isHovering ? (cursorType === 'image' ? 80 : 60) : 12,
          height: isHovering ? (cursorType === 'image' ? 80 : 60) : 12,
          borderRadius: cursorType === 'image' && isHovering ? '8px' : '50%',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center justify-center border-2 border-white bg-transparent"
      >
        {isHovering && cursorText && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-white text-xs font-semibold"
          >
            {cursorText}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;
