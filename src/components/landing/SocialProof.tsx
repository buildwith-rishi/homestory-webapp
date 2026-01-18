import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrandPattern } from '../shared';
import { useInView } from '../../hooks/useInView';

const metrics = [
  { value: 460, label: 'Projects Completed', suffix: '+' },
  { value: 10, label: 'Years of Excellence', suffix: '+' },
  { value: 4.9, label: 'Client Rating', suffix: '★', decimal: true },
  { value: 50, label: 'Projects Delivered', suffix: 'Cr+', prefix: '₹' },
];

const Counter: React.FC<{ value: number; suffix?: string; prefix?: string; decimal?: boolean }> = ({
  value,
  suffix = '',
  prefix = '',
  decimal = false,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold: 0.5 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let start = 0;
      const end = value;
      const duration = 1500;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value, hasAnimated]);

  const displayValue = decimal ? count.toFixed(1) : Math.floor(count);

  return (
    <div ref={ref} className="font-display text-4xl lg:text-5xl text-white">
      {prefix}{displayValue}{suffix}
    </div>
  );
};

const SocialProof: React.FC = () => {
  return (
    <section className="relative bg-secondary py-12 lg:py-16 overflow-hidden">
      <BrandPattern color="white" opacity={0.03} />

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`text-center ${
                index < metrics.length - 1 ? 'lg:border-r lg:border-white/20' : ''
              }`}
            >
              <Counter
                value={metric.value}
                suffix={metric.suffix}
                prefix={metric.prefix}
                decimal={metric.decimal}
              />
              <p className="font-body text-body-sm text-white/70 mt-2">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
