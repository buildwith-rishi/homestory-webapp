import React from "react";
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
} from "../components/landing";

const LandingPage: React.FC = () => {
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
      <FloatingActions />
    </div>
  );
};

export default LandingPage;
