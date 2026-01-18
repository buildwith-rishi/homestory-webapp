import React, { useState } from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import { Logo, BrandPattern } from '../shared';
import { Button, Input } from '../ui';
import { smoothScrollTo } from '../../utils/smoothScroll';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <footer className="relative bg-secondary text-white pt-16 pb-8">
      <BrandPattern color="white" opacity={0.05} className="absolute bottom-0 right-0 w-1/3 h-1/3" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Logo variant="full" colorScheme="light" size={130} className="mb-4" />
            <p className="font-body text-sm text-white/70 leading-relaxed">
              We help you create a space that truly feels like yours.
            </p>
          </div>

          <div>
            <h3 className="font-body font-medium text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {['Portfolio', 'Process', 'Testimonials', 'FAQ'].map((link) => (
                <li key={link}>
                  <button
                    onClick={() => smoothScrollTo(link.toLowerCase())}
                    className="font-body text-sm text-white/70 hover:text-primary transition-colors"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-body font-medium text-sm uppercase tracking-wider mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="text-white/50 flex-shrink-0 mt-0.5" size={16} />
                <span className="font-body text-sm text-white/70">
                  Bangalore, Karnataka, India
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="text-white/50 flex-shrink-0" size={16} />
                <a
                  href="tel:+919876543210"
                  className="font-body text-sm text-white/70 hover:text-primary transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="text-white/50 flex-shrink-0" size={16} />
                <a
                  href="mailto:hello@goodhomestory.in"
                  className="font-body text-sm text-white/70 hover:text-primary transition-colors"
                >
                  hello@goodhomestory.in
                </a>
              </li>
            </ul>

            <div className="flex gap-3 mt-6">
              {[Instagram, Facebook, Youtube, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                  aria-label={`Social link ${i + 1}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-body font-medium text-sm uppercase tracking-wider mb-4">
              Stay Updated
            </h3>
            <p className="font-body text-sm text-white/70 mb-4">
              Subscribe for design tips and offers
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button onClick={handleSubscribe} size="sm">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-white/60">
              © 2026 Good Homestory. All rights reserved.
            </p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms', 'Sitemap'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="font-body text-sm text-white/60 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
