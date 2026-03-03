import React from "react";
import { X, BarChart3, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { WidgetProps } from "./index";

interface FunnelStage {
  name: string;
  count: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  percentage: number;
}

const SalesPipelineWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const stages: FunnelStage[] = [
    {
      name: "New Leads",
      count: 145,
      color: "#3B82F6",
      gradientFrom: "from-blue-400",
      gradientTo: "to-blue-600",
      percentage: 100,
    },
    {
      name: "Qualified",
      count: 98,
      color: "#06B6D4",
      gradientFrom: "from-cyan-400",
      gradientTo: "to-cyan-600",
      percentage: 68,
    },
    {
      name: "Meeting",
      count: 54,
      color: "#8B5CF6",
      gradientFrom: "from-violet-400",
      gradientTo: "to-purple-600",
      percentage: 37,
    },
    {
      name: "Proposal",
      count: 28,
      color: "#F59E0B",
      gradientFrom: "from-amber-400",
      gradientTo: "to-orange-500",
      percentage: 19,
    },
    {
      name: "Won",
      count: 12,
      color: "#10B981",
      gradientFrom: "from-emerald-400",
      gradientTo: "to-emerald-600",
      percentage: 8,
    },
  ];

  const conversionRate = Math.round((stages[4].count / stages[0].count) * 100);
  const totalValue = 12400000;

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group relative overflow-hidden flex flex-col">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Sales Pipeline</h3>
            <p className="text-xs text-gray-400 font-medium">Funnel Overview</p>
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="flex-1 px-5 space-y-2">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-semibold text-gray-500 w-20 flex-shrink-0 truncate">
              {stage.name}
            </span>
            <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.percentage}%` }}
                transition={{
                  delay: index * 0.08 + 0.15,
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className={`h-full bg-gradient-to-r ${stage.gradientFrom} ${stage.gradientTo} rounded-lg flex items-center justify-end pr-2.5`}
              >
                <span className="text-xs font-bold text-white">
                  {stage.count}
                </span>
              </motion.div>
            </div>
            <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">
              {stage.percentage}%
            </span>
          </motion.div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="mx-4 mt-4 mb-4 grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">
            Conversion
          </p>
          <p className="text-xl font-extrabold text-emerald-700 leading-tight mt-0.5">
            {conversionRate}%
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
            Pipeline Value
          </p>
          <p className="text-xl font-extrabold text-blue-700 leading-tight mt-0.5">
            ₹{(totalValue / 100000).toFixed(1)}L
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesPipelineWidget;
