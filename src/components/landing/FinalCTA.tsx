import React from "react";
import { Calendar, ArrowRight, Phone, Mail } from "lucide-react";

const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          {/* Main CTA Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left: Content */}
              <div className="p-10 lg:p-12">
                <div className="mb-6">
                  <div className="inline-block px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <span className="text-sm font-semibold text-orange-600">
                      Free Consultation
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    Ready to Transform Your Space?
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Schedule a free consultation with our design team. We'll
                    discuss your vision, budget, and timeline to create your
                    dream home.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-8">
                  {[
                    "Free 3D design concepts",
                    "Detailed project timeline",
                    "Transparent pricing breakdown",
                    "No obligation quote",
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button className="w-full lg:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors group">
                  <Calendar className="w-5 h-5" />
                  Book Your Free Consultation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right: Contact Info */}
              <div className="bg-gray-50 p-10 lg:p-12 border-l border-gray-200">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Or Get In Touch
                  </h3>
                  <p className="text-gray-600">
                    Prefer to reach out directly? We're here to help.
                  </p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-4 mb-8">
                  <a
                    href="tel:+919876543210"
                    className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-200 hover:bg-orange-50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        Call Us
                      </div>
                      <div className="text-gray-600">+91 98765 43210</div>
                    </div>
                  </a>

                  <a
                    href="mailto:hello@goodhomestory.com"
                    className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-200 hover:bg-orange-50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        Email Us
                      </div>
                      <div className="text-gray-600">
                        hello@goodhomestory.com
                      </div>
                    </div>
                  </a>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      24h
                    </div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      98%
                    </div>
                    <div className="text-sm text-gray-600">
                      Client Satisfaction
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Trusted by 500+ homeowners across India • Licensed & Insured •
              1-Year Warranty
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
