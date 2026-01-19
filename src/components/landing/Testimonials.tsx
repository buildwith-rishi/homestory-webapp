import React, { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  image: string;
  rating: number;
  text: string;
  project: string;
}

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Priya Sharma",
      role: "Homeowner",
      company: "Whitefield Residency",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      rating: 5,
      text: "Good Homestory transformed our house into a dream home. Their attention to detail and professionalism exceeded all expectations. The team was responsive, creative, and delivered on time!",
      project: "3BHK Apartment - ₹45L",
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      role: "Business Owner",
      company: "Tech Innovations",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      rating: 5,
      text: "Exceptional work on our office interiors! The space is now modern, functional, and impresses every client who visits. Great value for money and outstanding project management.",
      project: "Corporate Office - ₹85L",
    },
    {
      id: 3,
      name: "Ananya Reddy",
      role: "Real Estate Developer",
      company: "Skyline Properties",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      rating: 5,
      text: "We've partnered with Good Homestory for multiple projects. Their consistency in quality and ability to meet tight deadlines makes them our go-to design partner.",
      project: "Luxury Villa - ₹1.2Cr",
    },
    {
      id: 4,
      name: "Vikram Mehta",
      role: "Homeowner",
      company: "Koramangala",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      rating: 5,
      text: "From concept to execution, everything was seamless. The team understood our vision perfectly and brought it to life with stunning results. Highly recommend!",
      project: "Penthouse Renovation - ₹95L",
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            What Our Clients Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it—hear from our delighted clients
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Client Info */}
              <div className="flex-shrink-0 text-center md:text-left">
                <img
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-20 h-20 rounded-full mx-auto md:mx-0 mb-4 object-cover"
                />

                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {currentTestimonial.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {currentTestimonial.role}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {currentTestimonial.company}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-1 mb-3">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-orange-500 text-orange-500"
                    />
                  ))}
                </div>

                <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-1 inline-block">
                  {currentTestimonial.project}
                </div>
              </div>

              {/* Testimonial Text */}
              <div className="flex-1">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  "{currentTestimonial.text}"
                </p>

                {/* Navigation */}
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? "bg-orange-500 w-8"
                            : "bg-gray-300 w-2"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={prevTestimonial}
                      className="w-10 h-10 bg-gray-100 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="w-10 h-10 bg-gray-100 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { label: "Average Rating", value: "4.9/5" },
              { label: "Total Reviews", value: "500+" },
              { label: "Repeat Clients", value: "85%" },
              { label: "Referral Rate", value: "92%" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-orange-500 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
