import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Badge } from '../ui';
import { smoothScrollTo } from '../../utils/smoothScroll';

interface Project {
  id: number;
  name: string;
  location: string;
  type: string;
  category: string;
  image: string;
}

const projects: Project[] = [
  { id: 1, name: 'Minimalist Living Room', location: 'Whitefield', type: '3BHK', category: 'living', image: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 2, name: 'Modern Bedroom Suite', location: 'HSR Layout', type: '2BHK', category: 'bedroom', image: 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 3, name: 'Contemporary Kitchen', location: 'Koramangala', type: 'Kitchen', category: 'kitchen', image: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 4, name: 'Complete Home Makeover', location: 'Indiranagar', type: 'Full Home', category: 'full', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 5, name: 'Scandinavian Living', location: 'Sarjapur', type: '3BHK', category: 'living', image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 6, name: 'Elegant Master Bedroom', location: 'JP Nagar', type: '4BHK', category: 'bedroom', image: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'living', label: 'Living Rooms' },
  { id: 'bedroom', label: 'Bedrooms' },
  { id: 'kitchen', label: 'Kitchens' },
  { id: 'full', label: 'Full Homes' },
];

const Portfolio: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter((p) => p.category === activeCategory);

  return (
    <>
      <section id="portfolio" className="py-24 bg-ash/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-display-lg text-secondary mb-4">
              Our Work Speaks for Itself
            </h2>
            <p className="font-body text-body-lg text-secondary/70">
              Explore our portfolio of transformed spaces
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <img
                    src={project.image}
                    alt={project.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6">
                    <h3 className="font-display text-display-sm text-white mb-2 text-center">
                      {project.name}
                    </h3>
                    <p className="font-body text-sm text-white/80 mb-4">
                      {project.location} · {project.type}
                    </p>
                    <span className="font-body text-sm text-primary">View Project →</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <div className="text-center mt-12">
            <Button variant="secondary" size="lg">
              View All Projects
            </Button>
          </div>
        </div>
      </section>

      {selectedProject && (
        <div className="fixed inset-0 bg-secondary/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-ash">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-display text-display-md text-secondary mb-2">
                    {selectedProject.name}
                  </h2>
                  <p className="font-body text-body text-ash">
                    {selectedProject.location} · {selectedProject.type}
                  </p>
                </div>
                <button onClick={() => setSelectedProject(null)}>
                  <X size={24} className="text-ash hover:text-secondary" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="aspect-video bg-ash/20 rounded-lg mb-6 overflow-hidden">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <Button onClick={() => smoothScrollTo('quote')} className="w-full">
                Get a Similar Design
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Portfolio;
