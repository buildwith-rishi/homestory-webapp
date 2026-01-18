import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What areas in Bangalore do you serve?',
    answer:
      'We serve all major areas of Bangalore including Whitefield, HSR Layout, Koramangala, Indiranagar, JP Nagar, Jayanagar, and more. We also take projects in Chennai, Kochi, and Mangalore.',
  },
  {
    question: 'What is the typical timeline for a project?',
    answer:
      'A standard 3BHK interior project takes 60-90 days from design approval to handover. This varies based on project scope and customization requirements.',
  },
  {
    question: 'Do you provide a warranty?',
    answer:
      'Yes, we provide a 10-year warranty on all modular furniture and fittings. This covers manufacturing defects and normal wear.',
  },
  {
    question: 'What is included in your pricing?',
    answer:
      'Our pricing includes design, materials, manufacturing, installation, and project management. We provide completely transparent quotations with no hidden costs.',
  },
  {
    question: 'Can I see your previous work?',
    answer:
      'Absolutely! You can explore our portfolio section above, take 360° virtual tours of completed projects, or visit our experience center in Bangalore.',
  },
  {
    question: 'Do you offer financing options?',
    answer:
      'Yes, we have partnered with leading banks to offer easy EMI options. You can spread your payment over 12-36 months with attractive interest rates.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-ash/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-display-lg text-secondary mb-4">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-body-lg text-secondary/70">
            Everything you need to know
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-ash/5 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-body font-medium text-lg text-secondary pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`text-primary flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    size={24}
                  />
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5">
                        <p className="font-body text-body text-secondary/80">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="font-body text-body text-secondary mb-4">Still have questions?</p>
            <Button variant="secondary">Contact Us</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
