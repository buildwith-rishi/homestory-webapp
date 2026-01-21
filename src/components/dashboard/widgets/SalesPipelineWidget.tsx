import React from "react";
import { X, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../ui";
import { WidgetProps } from "./index";

interface FunnelStage {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

const SalesPipelineWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const stages: FunnelStage[] = [
    { name: "New Leads", count: 145, color: "bg-blue-500", percentage: 100 },
    { name: "Qualified", count: 98, color: "bg-cyan-500", percentage: 68 },
    { name: "Meeting", count: 54, color: "bg-purple-500", percentage: 37 },
    { name: "Proposal", count: 28, color: "bg-orange-500", percentage: 19 },
    { name: "Won", count: 12, color: "bg-emerald-500", percentage: 8 },
  ];

  const totalValue = 1240000; // ₹12.4L potential value

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
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Sales Pipeline
              </h3>
              <p className="text-xs text-gray-500">Funnel Overview</p>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="space-y-2 mb-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-20 text-xs text-gray-600 truncate">
                {stage.name}
              </div>
              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percentage}%` }}
                  transition={{
                    delay: index * 0.1 + 0.2,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-2`}
                >
                  <span className="text-xs font-medium text-white">
                    {stage.count}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round((stages[4].count / stages[0].count) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Pipeline Value</p>
              <p className="text-lg font-bold text-emerald-600">
                ₹{(totalValue / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SalesPipelineWidget;
