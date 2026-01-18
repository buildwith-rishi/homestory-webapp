import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, PhoneOff } from 'lucide-react';
import { Logo } from '../shared';
import { Button } from '../ui';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CallState = 'connecting' | 'active' | 'ended';

const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({ isOpen, onClose }) => {
  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setCallState('active');
        setTranscript(['Hello! I\'m the Good Homestory assistant. How can I help you today?']);
      }, 2000);
    } else {
      setCallState('connecting');
      setTranscript([]);
      setCountdown(5);
    }
  }, [isOpen]);

  useEffect(() => {
    if (callState === 'ended' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (callState === 'ended' && countdown === 0) {
      onClose();
    }
  }, [callState, countdown, onClose]);

  const handleEndCall = () => {
    setCallState('ended');
    setTranscript([
      ...transcript,
      'Thank you for calling Good Homestory! We\'ll follow up with you soon.',
    ]);
  };

  const bars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-secondary/60 z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-brand-xl w-full max-w-md pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-ash flex justify-between items-center">
                <span className="font-body font-medium text-secondary">
                  Good Homestory Assistant
                </span>
                <button
                  onClick={onClose}
                  className="text-ash hover:text-secondary transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <div className="flex justify-center mb-8">
                  {callState === 'connecting' ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Logo variant="mark" size={80} />
                    </motion.div>
                  ) : callState === 'ended' ? (
                    <div className="w-20 h-20 bg-olive/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-olive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <Logo variant="mark" size={80} />
                  )}
                </div>

                {callState === 'active' && (
                  <div className="flex justify-center gap-1 mb-6 h-15">
                    {bars.map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{
                          height: [8, 32, 8],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="text-center mb-6">
                  {callState === 'connecting' && (
                    <p className="font-body text-body text-secondary">Connecting...</p>
                  )}
                  {callState === 'active' && (
                    <p className="font-body text-sm text-primary flex items-center justify-center gap-2">
                      {isMuted ? (
                        <>
                          <MicOff size={16} />
                          Muted
                        </>
                      ) : (
                        <>
                          <Mic size={16} />
                          Listening...
                        </>
                      )}
                    </p>
                  )}
                  {callState === 'ended' && (
                    <p className="font-body text-body text-secondary">
                      Thanks for calling!
                      <br />
                      <span className="text-sm text-ash">Closing in {countdown}s</span>
                    </p>
                  )}
                </div>

                {transcript.length > 0 && (
                  <div className="bg-ash/10 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
                    {transcript.map((text, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-body text-sm text-secondary mb-2 last:mb-0"
                      >
                        {text}
                      </motion.p>
                    ))}
                  </div>
                )}

                {callState === 'active' && (
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setIsMuted(!isMuted)}
                      leftIcon={isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={handleEndCall}
                      leftIcon={<PhoneOff size={18} />}
                    >
                      End Call
                    </Button>
                  </div>
                )}

                {callState === 'ended' && (
                  <div className="space-y-3">
                    <Button className="w-full">Get Quote via WhatsApp</Button>
                    <Button variant="secondary" className="w-full" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceAgentModal;
