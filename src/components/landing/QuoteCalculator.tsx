import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Phone, Mail } from 'lucide-react';
import { Button, Input, Select, Card, Badge, Progress } from '../ui';

interface FormData {
  propertyType: string;
  bhk: string;
  carpetArea: string;
  location: string;
  style: string;
  budgetMin: number;
  budgetMax: number;
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
    budgetMin: 15,
    budgetMax: 50,
    name: '',
    email: '',
    phone: '',
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const propertyTypes = [
    { id: 'apartment', label: 'Apartment', icon: '🏢' },
    { id: 'house', label: 'Independent House', icon: '🏠' },
    { id: 'villa', label: 'Villa', icon: '🏡' },
  ];

  const bhkOptions = ['1BHK', '2BHK', '3BHK', '4BHK', '4+'];
  const styleOptions = [
    { id: 'modern', label: 'Modern Minimalist' },
    { id: 'contemporary', label: 'Contemporary Indian' },
    { id: 'traditional', label: 'Traditional South' },
    { id: 'scandinavian', label: 'Scandinavian' },
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
        return formData.style !== '';
      case 4:
        return formData.name && formData.email && formData.phone;
      default:
        return false;
    }
  };

  return (
    <section id="quote" className="py-24 bg-ash/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-display-lg text-secondary mb-4">
            Get Your Instant Estimate
          </h2>
          <p className="font-body text-body-lg text-secondary/70">
            Tell us about your space in 60 seconds
          </p>
        </motion.div>

        <Card className="max-w-3xl mx-auto" padding="lg">
          {!showResult ? (
            <>
              <div className="mb-8">
                <Progress value={progress} />
                <div className="flex justify-between mt-2">
                  {[1, 2, 3, 4].map((s) => (
                    <span
                      key={s}
                      className={`font-body text-caption ${
                        s === step ? 'text-primary' : 'text-ash'
                      }`}
                    >
                      Step {s}
                    </span>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {step === 1 && (
                    <div>
                      <h3 className="font-display text-display-sm text-secondary mb-6">
                        What type of property?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {propertyTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() =>
                              setFormData({ ...formData, propertyType: type.id })
                            }
                            className={`p-6 rounded-lg border-2 transition-all ${
                              formData.propertyType === type.id
                                ? 'border-primary bg-primary/5'
                                : 'border-ash hover:border-primary/50'
                            }`}
                          >
                            <div className="text-4xl mb-2">{type.icon}</div>
                            <div className="font-body font-medium">{type.label}</div>
                            {formData.propertyType === type.id && (
                              <Check className="text-primary mx-auto mt-2" size={20} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h3 className="font-display text-display-sm text-secondary mb-6">
                        Property Details
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block font-body font-medium text-sm mb-3">
                            BHK Type
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {bhkOptions.map((bhk) => (
                              <button
                                key={bhk}
                                onClick={() => setFormData({ ...formData, bhk })}
                                className={`px-5 h-11 rounded-md transition-all ${
                                  formData.bhk === bhk
                                    ? 'bg-primary text-white'
                                    : 'bg-ash/30 text-secondary hover:bg-primary/10'
                                }`}
                              >
                                {bhk}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Input
                          label="Carpet Area (sq.ft.)"
                          type="number"
                          value={formData.carpetArea}
                          onChange={(e) =>
                            setFormData({ ...formData, carpetArea: e.target.value })
                          }
                          placeholder="1200"
                        />
                        <Select
                          label="Location"
                          options={[
                            { value: 'whitefield', label: 'Whitefield' },
                            { value: 'hsr', label: 'HSR Layout' },
                            { value: 'koramangala', label: 'Koramangala' },
                          ]}
                          value={formData.location}
                          onChange={(value) => setFormData({ ...formData, location: value })}
                        />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h3 className="font-display text-display-sm text-secondary mb-6">
                        Style Preferences
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {styleOptions.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setFormData({ ...formData, style: style.id })}
                            className={`aspect-[4/3] rounded-lg border-2 transition-all ${
                              formData.style === style.id
                                ? 'border-primary'
                                : 'border-ash hover:border-primary/50'
                            }`}
                          >
                            <div className="h-full bg-ash/20 flex items-center justify-center">
                              <div className="text-center">
                                <p className="font-body text-sm">{style.label}</p>
                                {formData.style === style.id && (
                                  <Check className="text-primary mx-auto mt-2" size={20} />
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block font-body font-medium text-sm mb-3">
                          Budget Range: ₹{formData.budgetMin}L - ₹{formData.budgetMax}L
                        </label>
                        <div className="flex gap-4">
                          <input
                            type="range"
                            min="15"
                            max="50"
                            value={formData.budgetMin}
                            onChange={(e) =>
                              setFormData({ ...formData, budgetMin: parseInt(e.target.value) })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <h3 className="font-display text-display-sm text-secondary mb-6">
                        Contact Details
                      </h3>
                      <div className="space-y-4">
                        <Input
                          label="Full Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Priya Sharma"
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="priya@example.com"
                        />
                        <Input
                          label="Phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8 pt-6 border-t border-ash">
                <Button
                  variant="ghost"
                  leftIcon={<ChevronLeft size={20} />}
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  Back
                </Button>
                <Button
                  rightIcon={step === totalSteps ? undefined : <ChevronRight size={20} />}
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  {step === totalSteps ? 'Get Estimate' : 'Next'}
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-olive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="text-olive" size={40} />
              </div>

              <h3 className="font-display text-display-lg text-secondary mb-4">
                ₹24,00,000 - ₹28,00,000
              </h3>
              <p className="font-body text-body text-ash mb-8">
                for {formData.carpetArea} sq.ft {formData.bhk} | Modern Minimalist Style
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {[
                  'Complete Design',
                  'Modular Kitchen',
                  'All Furniture',
                  'Electrical Work',
                  '10-Year Warranty',
                  'Project Management',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-left">
                    <Check className="text-olive flex-shrink-0" size={16} />
                    <span className="font-body text-sm text-secondary">{item}</span>
                  </div>
                ))}
              </div>

              <p className="font-body text-body text-secondary mb-6">
                Estimated Timeline: 75-90 days
              </p>

              <div className="space-y-3">
                <Button className="w-full">Send to WhatsApp</Button>
                <Button variant="secondary" className="w-full" leftIcon={<Phone size={18} />}>
                  Speak to Our Team Now
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default QuoteCalculator;
