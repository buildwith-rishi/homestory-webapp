import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { Avatar } from '../ui';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  project: string;
  rating: number;
  avatar?: string;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      'Good Homestory transformed our apartment into a space that perfectly reflects who we are. The attention to detail and understanding of our needs was remarkable.',
    author: 'Priya & Arjun Sharma',
    project: '3BHK, Whitefield',
    rating: 5,
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 2,
    quote:
      'From the first consultation to the final handover, the team was professional, transparent, and delivered exactly what they promised. Our home feels like a dream now.',
    author: 'Meera Krishnan',
    project: 'Villa Interiors, Sarjapur',
    rating: 5,
    image: 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 3,
    quote:
      'What impressed us most was how they balanced our traditional preferences with modern functionality. The result is a home that honors our roots while being practical for daily life.',
    author: 'Rajesh & Lakshmi Iyer',
    project: 'Full Home, Jayanagar',
    rating: 5,
    image: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

const Testimonials: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / 60;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [current, isPaused]);

  const handleNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setProgress(0);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setProgress(0);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const words = testimonials[current].quote.split(' ');

  return (
    <section
      id="testimonials"
      className="py-32 bg-gradient-to-b from-white via-orange-50/30 to-white relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #DC5800 0%, transparent 70%)',
          top: '10%',
          left: '5%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #DC5800 0%, transparent 70%)',
          bottom: '10%',
          right: '5%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4"
          >
            <span className="font-body text-sm font-semibold text-primary uppercase tracking-wider">
              Testimonials
            </span>
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-secondary mb-6 leading-tight">
            What Our Clients Say
          </h2>
          <p className="font-body text-lg md:text-xl text-secondary/70 max-w-2xl mx-auto">
            Real stories from homeowners who trusted us with their dream spaces
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl group">
                <img
                  src={testimonials[current].image}
                  alt={testimonials[current].project}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/40 to-transparent" />

                <div className="absolute bottom-8 left-8 right-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
                  >
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <Star size={20} className="fill-yellow-400 text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="font-display font-semibold text-secondary text-lg">
                      {testimonials[current].project}
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  className="absolute top-8 right-8 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-xl"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Quote className="text-white" size={32} />
                </motion.div>
              </div>
            </motion.div>

            <div className="relative order-1 lg:order-2">
              <motion.div
                className="absolute -top-8 -left-8 text-[150px] leading-none text-primary/10 font-serif pointer-events-none"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                "
              </motion.div>

              <div className="relative min-h-[400px] flex flex-col justify-center">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={current}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-8"
                  >
                    <div>
                      <p className="font-body text-2xl lg:text-3xl text-secondary leading-relaxed">
                        {words.map((word, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03, duration: 0.3 }}
                            className="inline-block mr-2"
                          >
                            {word}
                          </motion.span>
                        ))}
                      </p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-4"
                    >
                      <div className="relative">
                        <motion.div
                          className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary to-orange-600"
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                        <Avatar
                          size="xl"
                          initials={testimonials[current].author.split(' ').map(n => n[0]).join('')}
                          className="relative"
                        />
                      </div>
                      <div>
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="font-display text-xl font-semibold text-secondary"
                        >
                          {testimonials[current].author}
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                          className="font-body text-secondary/70"
                        >
                          {testimonials[current].project}
                        </motion.p>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-12">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrev}
                    className="w-14 h-14 rounded-full bg-white border-2 border-primary/20 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all shadow-lg"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft size={24} className="text-primary" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="w-14 h-14 rounded-full bg-primary hover:bg-orange-600 flex items-center justify-center transition-all shadow-lg"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight size={24} className="text-white" />
                  </motion.button>
                </div>

                <div className="flex gap-3">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className="relative"
                      aria-label={`Go to testimonial ${index + 1}`}
                    >
                      <div
                        className={`relative h-3 rounded-full transition-all ${
                          index === current
                            ? 'w-12 bg-primary'
                            : 'w-3 bg-secondary/20 hover:bg-secondary/40'
                        }`}
                      >
                        {index === current && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600 rounded-full origin-left"
                            style={{
                              scaleX: progress / 100,
                            }}
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <p className="font-body text-lg text-secondary/70 mb-6">
            Join 460+ happy homeowners who transformed their spaces with us
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-white transition-all shadow-lg"
          >
            Share Your Story
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
