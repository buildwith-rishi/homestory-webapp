import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, X, Share2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, Badge, Button, Modal } from '../ui';
import 'pannellum/build/pannellum.css';

interface TourProject {
  id: number;
  name: string;
  location: string;
  image: string;
  panoramaImage: string;
}

const tourProjects: TourProject[] = [
  {
    id: 1,
    name: 'Modern 3BHK Apartment',
    location: 'Whitefield, Bangalore',
    image: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
    panoramaImage: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    id: 2,
    name: 'Luxury Villa Interiors',
    location: 'Sarjapur Road',
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    panoramaImage: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    id: 3,
    name: 'Contemporary 2BHK',
    location: 'HSR Layout',
    image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800',
    panoramaImage: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
];

const TourCard: React.FC<{ project: TourProject; onEnter: () => void }> = ({ project, onEnter }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
      onClick={onEnter}
    >
      <img
        src={project.image}
        alt={project.name}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />

      <div className="absolute top-4 right-4">
        <Badge className="bg-primary text-white flex items-center gap-1.5">
          <Maximize2 size={14} />
          360°
        </Badge>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-body font-medium text-lg text-white mb-1">{project.name}</h3>
        <p className="font-body text-sm text-white/80">{project.location}</p>
      </div>

      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="text-white border-white hover:bg-primary">
          Enter Tour →
        </Button>
      </div>
    </motion.div>
  );
};

const TourViewer: React.FC<{ project: TourProject; onClose: () => void }> = ({ project, onClose }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumViewerRef = useRef<any>(null);

  useEffect(() => {
    if (viewerRef.current && !pannellumViewerRef.current) {
      import('pannellum').then((pannellum) => {
        pannellumViewerRef.current = pannellum.viewer(viewerRef.current!, {
          type: 'equirectangular',
          panorama: project.panoramaImage,
          autoLoad: true,
          autoRotate: -2,
          showControls: true,
          showFullscreenCtrl: true,
          showZoomCtrl: true,
          mouseZoom: true,
          hfov: 100,
          pitch: 0,
          yaw: 0,
          minHfov: 50,
          maxHfov: 120,
        });
      });
    }

    return () => {
      if (pannellumViewerRef.current) {
        pannellumViewerRef.current.destroy();
        pannellumViewerRef.current = null;
      }
    };
  }, [project.panoramaImage]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.name,
        text: `Check out this 360° tour of ${project.name}`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary z-50">
      <div className="h-16 border-b border-white/20 flex items-center justify-between px-6">
        <button
          onClick={onClose}
          className="text-white hover:text-primary transition-colors flex items-center gap-2"
        >
          <X size={24} />
          <span className="font-body text-sm hidden sm:inline">Close</span>
        </button>
        <h2 className="font-display text-display-sm text-white text-center flex-1">
          {project.name}
        </h2>
        <button
          onClick={handleShare}
          className="text-white hover:text-primary transition-colors flex items-center gap-2"
        >
          <span className="font-body text-sm hidden sm:inline">Share</span>
          <Share2 size={20} />
        </button>
      </div>

      <div className="h-[calc(100vh-64px)] relative">
        <div ref={viewerRef} className="w-full h-full" />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-secondary/80 backdrop-blur-sm px-4 py-3 rounded-lg">
          <p className="font-body text-sm text-white text-center">
            <RotateCw size={16} className="inline mr-2" />
            Drag to look around • Scroll to zoom • Click fullscreen for immersive view
          </p>
        </div>
      </div>
    </div>
  );
};

const VirtualTour: React.FC = () => {
  const [selectedTour, setSelectedTour] = useState<TourProject | null>(null);

  return (
    <>
      <section id="virtual-tour" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-display-lg text-secondary mb-4">
              Walk Through Our Completed Projects
            </h2>
            <p className="font-body text-body-lg text-secondary/70">
              Experience our work like you're really there
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tourProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <TourCard project={project} onEnter={() => setSelectedTour(project)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {selectedTour && (
        <TourViewer project={selectedTour} onClose={() => setSelectedTour(null)} />
      )}
    </>
  );
};

export default VirtualTour;
