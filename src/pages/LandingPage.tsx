import React, { useState } from 'react';
import {
  LandingNav,
  HeroSection,
  SocialProof,
  VirtualTour,
  Portfolio,
  QuoteCalculator,
  Testimonials,
  Process,
  FAQ,
  FinalCTA,
  Footer,
  FloatingActions,
  VoiceAgentModal,
} from '../components/landing';

const LandingPage: React.FC = () => {
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <SocialProof />
      <VirtualTour />
      <Portfolio />
      <QuoteCalculator />
      <Testimonials />
      <Process />
      <FAQ />
      <FinalCTA />
      <Footer />
      <FloatingActions onVoiceAgentClick={() => setIsVoiceAgentOpen(true)} />
      <VoiceAgentModal isOpen={isVoiceAgentOpen} onClose={() => setIsVoiceAgentOpen(false)} />
    </div>
  );
};

export default LandingPage;
