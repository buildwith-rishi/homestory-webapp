import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '../ui';
import { BrandPattern } from '../shared';
import { smoothScrollTo } from '../../utils/smoothScroll';
import { ChevronDown } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 20 });
  const scale = useTransform(scrollY, [0, 500], [1, 1.05]);

  const headline = "Every home is a story worth getting right.";
  const words = headline.split(' ');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setRipplePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsHoveringButton(true);
      setTimeout(() => setIsHoveringButton(false), 600);
    }
    smoothScrollTo('quote');
  };

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen flex items-center bg-gradient-to-b from-white via-gray-50/30 to-white overflow-hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #DC5800 0%, transparent 70%)',
          top: '20%',
          right: '10%',
        }}
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-10 h-10 rounded-full bg-primary/40"
        style={{
          top: '20%',
          left: '10%',
        }}
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-16 h-16 rounded-full bg-primary/30"
        style={{
          bottom: '25%',
          right: '15%',
        }}
        animate={{
          y: [0, 25, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-12 h-12 rounded-full bg-primary/20"
        style={{
          top: '60%',
          left: '15%',
        }}
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <BrandPattern opacity={0.02} className="absolute inset-0" />

      <div className="container mx-auto px-6 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="font-display text-4xl lg:text-[56px] leading-[1.1] text-secondary mb-6">
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
              className="font-body text-lg lg:text-xl text-secondary/80 mb-8 max-w-[500px]"
            >
              We help you create a space that truly feels like yours. One that reflects your
              culture, your routines, your chaos and your calm.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.button
                ref={buttonRef}
                onClick={handleButtonClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-8 py-4 bg-primary text-white font-semibold rounded-full overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Your Free Quote
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>

                {isHoveringButton && (
                  <motion.span
                    className="absolute inset-0 bg-white/30 rounded-full"
                    initial={{ scale: 0, x: ripplePosition.x, y: ripplePosition.y }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      transformOrigin: `${ripplePosition.x}px ${ripplePosition.y}px`,
                    }}
                  />
                )}

                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-orange-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            style={{ y: smoothY }}
            className="relative"
          >
            <motion.div
              className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-orange-600/20 rounded-2xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />

            <motion.div
              className="relative rounded-2xl overflow-hidden shadow-2xl group"
              style={{
                scale,
                rotateX: mousePosition.y * 2,
                rotateY: mousePosition.x * 2,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <motion.div
                className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-orange-600/10 relative"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src="https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Modern interior design living room"
                  className="w-full h-full object-cover hoverable-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent" />
              </motion.div>
              <BrandPattern opacity={0.03} className="absolute inset-0 pointer-events-none" />
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -right-4 w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5, type: 'spring' }}
            >
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">460+</div>
                <div className="text-xs text-secondary/70">Projects</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        onClick={() => smoothScrollTo('portfolio')}
      >
        <span className="text-sm text-secondary/60 font-body">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="text-primary" size={24} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
