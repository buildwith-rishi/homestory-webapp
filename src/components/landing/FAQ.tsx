import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "What services does Good Homestory offer?",
      answer:
        "We offer comprehensive interior design and construction services including residential interiors, commercial spaces, complete renovations, modular kitchens, custom furniture, and turnkey projects. From concept to completion, we handle everything.",
    },
    {
      question: "How much does an interior design project cost?",
      answer:
        "Project costs vary based on scope, space size, and material choices. Residential projects typically range from ₹15L to ₹1.5Cr+. We provide detailed quotes after understanding your requirements during the free consultation.",
    },
    {
      question: "How long does a typical project take?",
      answer:
        "Timelines depend on project complexity. A 2-3 BHK apartment typically takes 3-4 months, while larger villas may take 6-8 months. We provide a detailed timeline during the design phase and track progress through our CRM.",
    },
    {
      question: "Do you provide 3D designs before starting work?",
      answer:
        "Yes! Every project includes detailed 3D visualizations, mood boards, and material samples. You'll see exactly how your space will look before we begin construction. We iterate designs until you're 100% satisfied.",
    },
    {
      question: "Can I choose my own materials and vendors?",
      answer:
        "Absolutely! While we work with trusted suppliers for quality and pricing, you're welcome to source materials yourself. We provide material specifications and can coordinate with your vendors.",
    },
    {
      question: "What warranty do you provide?",
      answer:
        "We offer a 30-day satisfaction guarantee and 1-year warranty on all workmanship. Appliances and materials carry manufacturer warranties. Our team is available for support even after project completion.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about working with Good Homestory
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <div className="inline-block bg-gray-50 rounded-xl px-8 py-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-4">
              Can't find the answer you're looking for? We're here to help.
            </p>
            <button className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors">
              Contact Our Team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
