import React from "react";
import { MessageCircle, Palette, ShoppingBag, Hammer, Key } from "lucide-react";

const Process: React.FC = () => {
  const steps = [
    {
      icon: MessageCircle,
      title: "Consultation",
      description:
        "Free consultation to understand your vision, requirements, and budget.",
      duration: "1-2 days",
    },
    {
      icon: Palette,
      title: "Design",
      description:
        "3D designs, mood boards, and detailed plans tailored to your space.",
      duration: "1-2 weeks",
    },
    {
      icon: ShoppingBag,
      title: "Material Selection",
      description: "Premium materials and finishes with transparent pricing.",
      duration: "3-5 days",
    },
    {
      icon: Hammer,
      title: "Execution",
      description: "Expert craftsmen bring your design to life with precision.",
      duration: "2-6 months",
    },
    {
      icon: Key,
      title: "Handover",
      description:
        "Final walkthrough and 30-day guarantee for complete satisfaction.",
      duration: "1 day",
    },
  ];

  return (
    <section id="process" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            How We Work
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From concept to completion, we make your dream home a reality
          </p>
        </div>

        {/* Steps Grid */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                {/* Icon */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                    <step.icon className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                <div className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  {step.duration}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors">
            Start Your Project Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default Process;
