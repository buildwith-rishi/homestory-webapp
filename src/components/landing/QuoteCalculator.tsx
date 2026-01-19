import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Phone, Mail, Building2, Home, Trees, MapPin } from 'lucide-react';

interface FormData {
  propertyType: string;
  bhk: string;
  carpetArea: string;
  location: string;
  style: string;
  budgetRange: string;
  name: string;
  email: string;
  phone: string;
}

const QuoteCalculator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    propertyType: '',
    bhk: '',
    carpetArea: '',
    location: '',
    style: '',
    budgetRange: '',
    name: '',
    email: '',
    phone: '',
  });

  const totalSteps = 4;

  const propertyTypes = [
    { id: 'apartment', label: 'Apartment', icon: Building2 },
    { id: 'house', label: 'Independent House', icon: Home },
    { id: 'villa', label: 'Villa', icon: Trees },
  ];

  const bhkOptions = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];
  
  const styleOptions = [
    { id: 'modern', label: 'Modern Minimalist', desc: 'Clean lines, neutral colors' },
    { id: 'contemporary', label: 'Contemporary Indian', desc: 'Fusion of traditional & modern' },
    { id: 'traditional', label: 'Traditional South Indian', desc: 'Classic ethnic design' },
    { id: 'scandinavian', label: 'Scandinavian', desc: 'Light, airy, functional' },
  ];

  const budgetRanges = [
    { id: '15-25', label: '₹15L - ₹25L' },
    { id: '25-40', label: '₹25L - ₹40L' },
    { id: '40-60', label: '₹40L - ₹60L' },
    { id: '60+', label: '₹60L+' },
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.propertyType !== '';
      case 2:
        return formData.bhk !== '' && formData.carpetArea !== '';
      case 3:
        return formData.style !== '' && formData.budgetRange !== '';
      case 4:
        return formData.name && formData.email && formData.phone;
      default:
        return false;
    }
  };

  const calculateEstimate = () => {
    const area = parseInt(formData.carpetArea) || 1000;
    const baseCost = 1800;
    const estimate = area * baseCost;
    const min = Math.floor(estimate * 0.9 / 100000);
    const max = Math.floor(estimate * 1.1 / 100000);
    return { min, max };
  };

  return (
    <section id="quote" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Get Your Instant Estimate
          </h2>
          <p className="text-lg text-gray-600">
            Tell us about your space in 60 seconds
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {!showResult ? (
            <>
              {/* Progress Bar */}
              <div className="px-6 lg:px-10 pt-8 pb-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                            s < step
                              ? 'bg-orange-500 text-white'
                              : s === step
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {s < step ? <Check className="w-4 h-4" /> : s}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium ${
                            s === step ? 'text-orange-500' : 'text-gray-400'
                          }`}
                        >
                          Step {s}
                        </span>
                      </div>
                      {s < 4 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 ${
                            s < step ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 lg:px-10 py-8">
                {step === 1 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      What type of property?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() =>
                              setFormData({ ...formData, propertyType: type.id })
                            }
                            className={`p-6 rounded-xl border-2 transition-all text-center hover:border-orange-300 ${
                              formData.propertyType === type.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Icon
                              className={`w-12 h-12 mx-auto mb-3 ${
                                formData.propertyType === type.id
                                  ? 'text-orange-500'
                                  : 'text-gray-400'
                              }`}
                            />
                            <div className="font-semibold text-gray-900">{type.label}</div>
                            {formData.propertyType === type.id && (
                              <div className="mt-3 inline-flex items-center justify-center w-6 h-6 bg-orange-500 rounded-full">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Property Details
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          BHK Type
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                          {bhkOptions.map((bhk) => (
                            <button
                              key={bhk}
                              onClick={() => setFormData({ ...formData, bhk })}
                              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                formData.bhk === bhk
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {bhk}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Carpet Area (sq.ft.)
                        </label>
                        <input
                          type="number"
                          value={formData.carpetArea}
                          onChange={(e) =>
                            setFormData({ ...formData, carpetArea: e.target.value })
                          }
                          placeholder="e.g., 1200"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Location (Optional)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({ ...formData, location: e.target.value })
                            }
                            placeholder="e.g., Whitefield, Bangalore"
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Style & Budget
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Interior Style
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {styleOptions.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setFormData({ ...formData, style: style.id })}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.style === style.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {style.label}
                                  </div>
                                  <div className="text-sm text-gray-600">{style.desc}</div>
                                </div>
                                {formData.style === style.id && (
                                  <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Budget Range
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {budgetRanges.map((budget) => (
                            <button
                              key={budget.id}
                              onClick={() =>
                                setFormData({ ...formData, budgetRange: budget.id })
                              }
                              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                formData.budgetRange === budget.id
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {budget.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Contact Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Priya Sharma"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="priya@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="px-6 lg:px-10 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                    step === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                    !isStepValid()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {step === totalSteps ? 'Get Estimate' : 'Next'}
                  {step !== totalSteps && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </>
          ) : (
            <div className="px-6 lg:px-10 py-10 text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              {/* Estimate */}
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                ₹{calculateEstimate().min}L - ₹{calculateEstimate().max}L
              </h3>
              <p className="text-gray-600 mb-8">
                Estimated cost for {formData.carpetArea} sq.ft {formData.bhk}
              </p>

              {/* Inclusions */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-4 text-left">
                  What's Included:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Complete Design',
                    'Modular Kitchen',
                    'All Furniture',
                    'Electrical Work',
                    '1-Year Warranty',
                    'Project Management',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-left">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-left">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Estimated Timeline:</span> 75-90 days
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Phone className="w-5 h-5" />
                  Speak to Our Team Now
                </button>
                <button className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Mail className="w-5 h-5" />
                  Email Me This Estimate
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 mt-6">
                This is an approximate estimate. Final quote may vary based on material choices and specific requirements.
              </p>
            </div>
          )}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            ✓ No spam, we respect your privacy • ✓ Free consultation • ✓ No obligation
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuoteCalculator;
