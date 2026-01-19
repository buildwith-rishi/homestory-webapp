import React, { useState } from "react";
import { MapPin, ArrowRight } from "lucide-react";

type Category = "All" | "Residential" | "Commercial" | "Renovation";

interface Project {
  id: number;
  title: string;
  category: Category;
  location: string;
  budget: string;
  image: string;
}

const Portfolio: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const projects: Project[] = [
    {
      id: 1,
      title: "Modern 3BHK in Whitefield",
      category: "Residential",
      location: "Whitefield, Bangalore",
      budget: "₹45L",
      image:
        "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600",
    },
    {
      id: 2,
      title: "Luxury Villa Interiors",
      category: "Residential",
      location: "Koramangala, Bangalore",
      budget: "₹1.2Cr",
      image:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600",
    },
    {
      id: 3,
      title: "Corporate Office Design",
      category: "Commercial",
      location: "HSR Layout, Bangalore",
      budget: "₹85L",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
    },
    {
      id: 4,
      title: "Apartment Renovation",
      category: "Renovation",
      location: "Indiranagar, Bangalore",
      budget: "₹28L",
      image:
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600",
    },
    {
      id: 5,
      title: "Boutique Hotel Suite",
      category: "Commercial",
      location: "MG Road, Bangalore",
      budget: "₹65L",
      image:
        "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600",
    },
    {
      id: 6,
      title: "Penthouse Transformation",
      category: "Renovation",
      location: "Jayanagar, Bangalore",
      budget: "₹95L",
      image:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600",
    },
  ];

  const categories: Category[] = [
    "All",
    "Residential",
    "Commercial",
    "Renovation",
  ];

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <section id="portfolio" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Our Portfolio
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our recent projects across residential, commercial, and
            renovation spaces
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Project Image */}
              <div className="relative h-56 overflow-hidden bg-gray-100">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Category Badge */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-md text-xs font-semibold text-gray-900">
                  {project.category}
                </div>
              </div>

              {/* Project Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {project.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="text-lg font-bold text-orange-500">
                    {project.budget}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More CTA */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors">
            View All Projects
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
