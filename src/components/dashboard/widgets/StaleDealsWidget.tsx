import React from "react";
import { X, AlertTriangle, ArrowRight, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Card, Badge, Button } from "../../ui";
import { WidgetProps } from "./index";

interface StaleDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  daysStuck: number;
  stage: string;
  owner: string;
}

const StaleDealsWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const staleDeals: StaleDeal[] = [
    {
      id: "1",
      name: "Luxury Villa Project",
      company: "Kumar Residence",
      value: 4500000,
      daysStuck: 21,
      stage: "Proposal",
      owner: "Rahul K.",
    },
    {
      id: "2",
      name: "Modern Office Interior",
      company: "TechStart Inc",
      value: 2800000,
      daysStuck: 18,
      stage: "Proposal",
      owner: "Priya S.",
    },
    {
      id: "3",
      name: "3BHK Renovation",
      company: "Gupta Family",
      value: 1500000,
      daysStuck: 15,
      stage: "Negotiation",
      owner: "Amit P.",
    },
  ];

  const totalAtRisk = staleDeals.reduce((sum, deal) => sum + deal.value, 0);

  const getUrgencyColor = (days: number) => {
    if (days >= 21) return "text-red-600 bg-red-100";
    if (days >= 14) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
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
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Stale Opportunities
              </h3>
              <p className="text-xs text-gray-500">Stuck for 14+ days</p>
            </div>
          </div>
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {staleDeals.length} Alert
          </Badge>
        </div>

        {/* Alert Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-orange-700">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">
              ₹{(totalAtRisk / 100000).toFixed(1)}L at risk
            </span>
          </div>
          <p className="text-xs text-orange-600 mt-1">
            {staleDeals.length} deals need immediate attention
          </p>
        </div>

        {/* Deal List */}
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {staleDeals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* Days Indicator */}
              <div
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${getUrgencyColor(deal.daysStuck)}`}
              >
                <span className="text-xs font-bold">{deal.daysStuck}</span>
                <span className="text-[8px]">days</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {deal.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{deal.company}</span>
                  <span>•</span>
                  <span className="font-medium text-gray-700">
                    ₹{(deal.value / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>

              {/* Stage Badge */}
              <Badge variant="neutral" className="text-xs flex-shrink-0">
                {deal.stage}
              </Badge>
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
            Review All Stale Deals <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StaleDealsWidget;
