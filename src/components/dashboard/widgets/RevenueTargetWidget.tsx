import React from "react";
import { X, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../ui";
import { WidgetProps } from "./index";

const RevenueTargetWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const currentRevenue = 4520000; // ₹45.2L
  const targetRevenue = 6000000; // ₹60L
  const percentage = Math.round((currentRevenue / targetRevenue) * 100);

  const getProgressColor = () => {
    if (percentage >= 90) return "emerald";
    if (percentage >= 70) return "orange";
    return "red";
  };

  const colorMap = {
    emerald: {
      bg: "bg-emerald-100",
      text: "text-emerald-600",
      progress: "bg-emerald-500",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      progress: "bg-orange-500",
    },
    red: { bg: "bg-red-100", text: "text-red-600", progress: "bg-red-500" },
  };

  const color = colorMap[getProgressColor()];

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
            <div
              className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center`}
            >
              <Target className={`w-5 h-5 ${color.text}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Revenue vs Target
              </h3>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </div>
        </div>

        {/* Gauge Visualization */}
        <div className="relative mb-4">
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-16 overflow-hidden">
              {/* Background Arc */}
              <div className="absolute inset-0 border-8 border-gray-200 rounded-t-full" />

              {/* Progress Arc */}
              <motion.div
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + percentage * 1.8 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`absolute inset-0 border-8 ${color.progress.replace("bg-", "border-")} rounded-t-full origin-bottom`}
                style={{
                  clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 100%, 0 100%)",
                }}
              />

              {/* Center Text */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <span className={`text-2xl font-bold ${color.text}`}>
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Alternative */}
        <div className="space-y-2">
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${color.progress} rounded-full`}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                ₹{(currentRevenue / 100000).toFixed(1)}L
              </span>{" "}
              / ₹{(targetRevenue / 100000).toFixed(0)}L
            </span>
            <span className={`font-medium ${color.text}`}>
              {percentage >= 100
                ? "Goal Met! 🎉"
                : `${100 - percentage}% to go`}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">Last Month</p>
            <p className="text-sm font-semibold text-gray-900">₹38.5L</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Growth</p>
            <p className="text-sm font-semibold text-emerald-600">+17.4%</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RevenueTargetWidget;
