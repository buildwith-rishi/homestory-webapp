import React from "react";
import { Award, Users, TrendingUp, Home } from "lucide-react";

const SocialProof: React.FC = () => {
  const stats = [
    { icon: Home, label: "Projects Completed", value: "500+" },
    { icon: Users, label: "Happy Clients", value: "450+" },
    { icon: TrendingUp, label: "Years of Excellence", value: "12+" },
    { icon: Award, label: "Industry Awards", value: "25+" },
  ];

  return (
    <section className="py-16 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <stat.icon className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trusted By */}
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">
            Trusted By Leading Developers
          </p>

          <div className="flex flex-wrap justify-center gap-8 items-center opacity-40">
            {[
              "Prestige",
              "Brigade",
              "Sobha",
              "Embassy",
              "Godrej",
              "Puravankara",
            ].map((client, index) => (
              <div key={index} className="text-gray-400 font-bold text-lg">
                {client}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
