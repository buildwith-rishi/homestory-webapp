import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Logo } from '../shared';
import { Button } from '../ui';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { smoothScrollTo } from '../../utils/smoothScroll';

const navLinks = [
  { label: 'Portfolio', href: 'portfolio' },
  { label: 'Process', href: 'process' },
  { label: 'Testimonials', href: 'testimonials' },
  { label: 'FAQ', href: 'faq' },
];

const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { scrollY, scrollDirection } = useScrollPosition();
  const navLinksRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isScrolled = scrollY > 100;
  const shouldHide = scrollDirection === 'down' && scrollY > 200;

  useEffect(() => {
    const calculateScrollProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / (documentHeight - windowHeight)) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', calculateScrollProgress);
    return () => window.removeEventListener('scroll', calculateScrollProgress);
  }, []);

  useEffect(() => {
    navLinksRefs.current.forEach((link) => {
      if (!link) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = link.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = 50;

        if (distance < maxDistance) {
          const strength = (maxDistance - distance) / maxDistance;
          gsap.to(link, {
            x: x * strength * 0.3,
            y: y * strength * 0.3,
            duration: 0.3,
            ease: 'power2.out',
          });
        } else {
          gsap.to(link, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(link, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      link.addEventListener('mousemove', handleMouseMove);
      link.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        link.removeEventListener('mousemove', handleMouseMove);
        link.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, []);

  const handleNavClick = (href: string) => {
    smoothScrollTo(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-50"
        style={{
          width: `${scrollProgress}%`,
          transformOrigin: 'left',
        }}
      />

      <motion.nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg' : 'bg-transparent'
        }`}
        initial={false}
        animate={{
          y: shouldHide ? -100 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-18 lg:h-18">
            <button onClick={() => smoothScrollTo('hero')} className="focus:outline-none">
              <Logo
                variant="full"
                colorScheme={isScrolled ? 'default' : 'default'}
                size={130}
              />
            </button>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, index) => (
                <button
                  key={link.href}
                  ref={(el) => (navLinksRefs.current[index] = el)}
                  onClick={() => handleNavClick(link.href)}
                  className="relative font-body text-body text-secondary hover:text-primary transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out group-hover:w-full" />
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-primary transition-colors"
              >
                <LogIn size={18} />
                <span className="text-sm font-medium">Admin</span>
              </button>
              <Button onClick={() => handleNavClick('quote')} rightIcon={<span>→</span>}>
                Get Quote
              </Button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-secondary hover:text-primary transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 lg:hidden"
          >
            <div className="container mx-auto px-6 py-6">
              <div className="flex justify-between items-center mb-12">
                <Logo variant="full" size={130} />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-secondary hover:text-primary transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col items-center gap-6 mb-12">
                {navLinks.map((link, index) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNavClick(link.href)}
                    className="font-display text-display-sm text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </motion.button>
                ))}
              </nav>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="secondary"
                  className="w-full"
                  leftIcon={<LogIn size={18} />}
                >
                  Admin Login
                </Button>
                <Button
                  onClick={() => handleNavClick('quote')}
                  className="w-full"
                  rightIcon={<span>→</span>}
                >
                  Get Quote
                </Button>
                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1">
                    Call Us
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNav;
