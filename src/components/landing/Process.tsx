import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Ruler, PenTool, FileText, Hammer, Key, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Consultation',
    description: 'Share your vision with us through a detailed discussion about your style preferences, budget, and timeline',
    icon: MessageCircle,
    image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    number: 2,
    title: 'Site Visit',
    description: 'Our experts visit your space to take precise measurements and understand the layout and structural aspects',
    icon: Ruler,
    image: 'https://images.pexels.com/photos/7578974/pexels-photo-7578974.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    number: 3,
    title: 'Design',
    description: 'Create stunning 3D visualizations with material selections, color palettes, and detailed design plans',
    icon: PenTool,
    image: 'https://images.pexels.com/photos/7652176/pexels-photo-7652176.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    number: 4,
    title: 'Quotation',
    description: 'Receive a detailed, transparent quotation breaking down all costs with no hidden charges',
    icon: FileText,
    image: 'https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    number: 5,
    title: 'Execution',
    description: 'Our skilled team executes the project with precision, maintaining quality and adhering to timelines',
    icon: Hammer,
    image: 'https://images.pexels.com/photos/6585607/pexels-photo-6585607.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    number: 6,
    title: 'Handover',
    description: 'Walk into your beautifully transformed space, ready to create lasting memories',
    icon: Key,
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

const Process: React.FC = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section id="process" className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="container mx-auto px-6 relative">
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
              How We Work
            </span>
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-secondary mb-6 leading-tight">
            Our Simple 6-Step Process
          </h2>
          <p className="font-body text-lg md:text-xl text-secondary/70 max-w-2xl mx-auto">
            From vision to reality, we're with you every step of the way
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 transform -translate-x-1/2"></div>

            <div className="space-y-12 lg:space-y-24">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;
                const isHovered = hoveredStep === step.number;

                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    onMouseEnter={() => setHoveredStep(step.number)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className="relative"
                  >
                    <div className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                      isEven ? '' : 'lg:grid-flow-dense'
                    }`}>
                      <div className={`${isEven ? '' : 'lg:col-start-2'} relative z-10`}>
                        <motion.div
                          animate={{
                            x: isHovered ? (isEven ? 10 : -10) : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center gap-4">
                            <motion.div
                              animate={{
                                scale: isHovered ? 1.1 : 1,
                                rotate: isHovered ? 5 : 0,
                              }}
                              transition={{ duration: 0.3 }}
                              className="relative"
                            >
                              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"></div>
                              <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Icon className="text-white" size={36} />
                              </div>
                            </motion.div>

                            <div className="text-8xl lg:text-9xl font-display font-bold text-primary/5 leading-none">
                              {step.number}
                            </div>
                          </div>

                          <div className="space-y-3 pl-2">
                            <h3 className="font-display text-3xl lg:text-4xl text-secondary">
                              {step.title}
                            </h3>
                            <p className="font-body text-base lg:text-lg text-secondary/70 leading-relaxed">
                              {step.description}
                            </p>

                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{
                                opacity: isHovered ? 1 : 0,
                                x: isHovered ? 0 : -20,
                              }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-2 text-primary font-semibold pt-2"
                            >
                              <span>Learn more</span>
                              <ArrowRight size={18} />
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>

                      <div className={`${isEven ? 'lg:col-start-2' : 'lg:col-start-1'} relative z-10`}>
                        <motion.div
                          animate={{
                            scale: isHovered ? 1.05 : 1,
                            x: isHovered ? (isEven ? -10 : 10) : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          className="relative group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-600/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

                          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                            <img
                              src={step.image}
                              alt={step.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-secondary/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{
                                opacity: isHovered ? 1 : 0,
                                y: isHovered ? 0 : 20,
                              }}
                              transition={{ duration: 0.3 }}
                              className="absolute bottom-6 left-6 right-6"
                            >
                              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Icon className="text-primary" size={20} />
                                  </div>
                                  <div>
                                    <div className="font-display font-semibold text-secondary text-sm">
                                      Step {step.number}
                                    </div>
                                    <div className="font-body text-xs text-secondary/60">
                                      {step.title}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>

                            <div className="absolute top-6 right-6">
                              <motion.div
                                animate={{
                                  scale: isHovered ? 1 : 0.9,
                                  opacity: isHovered ? 1 : 0.8,
                                }}
                                className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                              >
                                <span className="font-display font-bold text-primary text-lg">
                                  {step.number}
                                </span>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute left-1/2 -bottom-12 transform -translate-x-1/2 z-20">
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 }}
                          className="w-12 h-12 bg-white border-4 border-primary/30 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <ArrowRight className="text-primary rotate-90" size={20} />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <span className="font-body font-semibold text-lg">Start Your Journey Today</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Process;
