import React from 'react';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Button } from '../ui';
import { BrandPattern } from '../shared';
import { smoothScrollTo } from '../../utils/smoothScroll';

const FinalCTA: React.FC = () => {
  return (
    <section className="relative bg-primary py-20 overflow-hidden">
      <BrandPattern color="white" opacity={0.1} />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-display-xl lg:text-5xl text-white mb-4">
            Ready to Transform Your Space?
          </h2>
          <p className="font-body text-xl text-white/90 mb-8">
            Let's create your perfect home together
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => smoothScrollTo('quote')}
            >
              Get Free Quote
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border-2 border-white text-white hover:bg-white hover:text-primary"
              leftIcon={<Phone size={20} />}
            >
              Call Now
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
