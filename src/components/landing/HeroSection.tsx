import React from "react";
import { smoothScrollTo } from "../../utils/smoothScroll";
import { ArrowRight, Star, CheckCircle2 } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative bg-white">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full mb-6">
              <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span className="text-xs font-medium text-gray-700">
                Rated 4.9/5 by 500+ Happy Clients
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Transform Your Space Into A{" "}
              <span className="text-orange-500">Dream Home</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Award-winning interior design and construction services that bring
              your vision to life. From concept to completion, we create spaces
              you'll love.
            </p>

            {/* Feature List */}
            <div className="flex flex-wrap gap-6 mb-10">
              {["Free 3D Design", "30-Day Guarantee", "Turnkey Solutions"].map(
                (feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {feature}
                    </span>
                  </div>
                ),
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => smoothScrollTo("quote")}
                className="group px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                Get Free Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => smoothScrollTo("portfolio")}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-semibold border border-gray-300 transition-colors"
              >
                View Portfolio
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Projects Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">12+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative lg:h-[600px]">
            {/* Main Image */}
            <div className="relative h-full rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&auto=format&fit=crop"
                alt="Modern Living Room"
                className="w-full h-full object-cover"
              />

              {/* Overlay Badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      Recent Project
                    </div>
                    <div className="text-base font-bold text-gray-900 mb-2">
                      Modern 3BHK in Whitefield
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-3.5 h-3.5 text-orange-500 fill-orange-500"
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">
                        (5.0 Rating)
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-orange-500">
                      ₹45L
                    </div>
                    <div className="text-xs text-gray-500">Budget</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute top-6 right-6 bg-orange-500 rounded-xl px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <div className="text-left">
                  <div className="text-lg font-bold text-white">98%</div>
                  <div className="text-xs text-orange-100">
                    On-Time Delivery
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
