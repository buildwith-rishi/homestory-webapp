import React from "react";
import { X, Target, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Card, Badge, Button } from "../../ui";
import { WidgetProps } from "./index";

interface HotLead {
  id: string;
  name: string;
  company: string;
  budget: number;
  score: number;
  lastContact: string;
  phone: string;
}

const HotLeadsWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const hotLeads: HotLead[] = [
    {
      id: "1",
      name: "Sneha Reddy",
      company: "4BHK Villa Project",
      budget: 5500000,
      score: 92,
      lastContact: "1 day ago",
      phone: "+91 98123 45678",
    },
    {
      id: "2",
      name: "Ramesh Iyer",
      company: "3BHK Apartment",
      budget: 2800000,
      score: 85,
      lastContact: "2 hours ago",
      phone: "+91 98765 43210",
    },
    {
      id: "3",
      name: "Priya Sharma",
      company: "Luxury Apartment",
      budget: 3200000,
      score: 88,
      lastContact: "3 hours ago",
      phone: "+91 87654 32109",
    },
    {
      id: "4",
      name: "Amit Patel",
      company: "Modern 2BHK",
      budget: 1800000,
      score: 82,
      lastContact: "5 hours ago",
      phone: "+91 76543 21098",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-700";
    if (score >= 80) return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <Card className="h-full animate-scale-in group relative">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                High-Priority Leads
              </h3>
              <p className="text-xs text-gray-500">Score &gt;80%</p>
            </div>
          </div>
          <Badge className="bg-red-100 text-red-700">
            {hotLeads.length} Hot
          </Badge>
        </div>

        {/* Lead List */}
        <div className="space-y-3 max-h-52 overflow-y-auto">
          {hotLeads.slice(0, 4).map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {lead.company} • ₹{(lead.budget / 100000).toFixed(1)}L
                </p>
              </div>

              {/* Score */}
              <div
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${getScoreColor(lead.score)}`}
              >
                {lead.score}%
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            View All Leads <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HotLeadsWidget;
