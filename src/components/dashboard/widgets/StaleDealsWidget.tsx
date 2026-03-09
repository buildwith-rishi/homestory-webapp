import React, { useMemo } from "react";
import {
  X,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Flame,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";
import { WidgetProps } from "./index";
import { useProjectStore } from "../../../stores/projectStore";

interface StaleDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  daysStuck: number;
  stage: string;
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Proposal: { bg: "bg-blue-50", text: "text-blue-700" },
  Negotiation: { bg: "bg-purple-50", text: "text-purple-700" },
  Design: { bg: "bg-indigo-50", text: "text-indigo-700" },
  Execution: { bg: "bg-amber-50", text: "text-amber-700" },
  default: { bg: "bg-gray-100", text: "text-gray-600" },
};

const StaleDealsWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const navigate = useNavigate();
  const { projects, isLoading } = useProjectStore();

  const staleDeals = useMemo<StaleDeal[]>(() => {
    const today = new Date();
    return projects
      .filter(
        (p) =>
          p.status !== "COMPLETED" &&
          p.status !== "CANCELLED" &&
          p.status !== "ON_HOLD",
      )
      .map((p) => {
        const updated = p.updatedAt
          ? parseISO(p.updatedAt)
          : new Date(p.createdAt);
        const days = differenceInDays(today, updated);
        const company = p.account?.name || p.lead?.name || "Unknown";
        const value =
          typeof p.totalValue === "string"
            ? parseFloat(p.totalValue) || 0
            : p.totalValue || 0;
        const rawStage =
          p.currentStageCode || p.currentPhase || p.status || "Active";
        // Convert snake_case codes to readable labels
        const stage = rawStage
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        return {
          id: p.id,
          name: p.projectName || p.name || "Untitled Project",
          company,
          value,
          daysStuck: days,
          stage,
        };
      })
      .filter((d) => d.daysStuck >= 14)
      .sort((a, b) => b.daysStuck - a.daysStuck)
      .slice(0, 5);
  }, [projects]);

  const totalAtRisk = staleDeals.reduce((sum, deal) => sum + deal.value, 0);

  const getUrgencyConfig = (days: number) => {
    if (days >= 21)
      return {
        ring: "ring-red-400",
        bg: "bg-red-600",
        label: "text-red-600",
        pill: "bg-red-50 text-red-700",
      };
    if (days >= 14)
      return {
        ring: "ring-orange-400",
        bg: "bg-orange-500",
        label: "text-orange-600",
        pill: "bg-orange-50 text-orange-700",
      };
    return {
      ring: "ring-yellow-400",
      bg: "bg-yellow-500",
      label: "text-yellow-600",
      pill: "bg-yellow-50 text-yellow-700",
    };
  };

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

      {/* Colored Header Strip */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 pt-4 pb-5 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-wide">
                Stale Opportunities
              </h3>
              <p className="text-orange-100 text-xs">Stuck for 14+ days</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">
              {staleDeals.length} Alert
            </span>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-xs">Total value at risk</p>
            <p className="text-white font-extrabold text-xl leading-tight">
              ₹{(totalAtRisk / 100000).toFixed(1)}L
            </p>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-xs">{staleDeals.length} deals</p>
            <p className="text-white text-xs font-medium">need attention</p>
          </div>
        </div>
      </div>

      {/* Deal List */}
      <div className="flex-1 px-4 pt-3 pb-2 space-y-1.5 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : staleDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">No stale deals</p>
            <p className="text-xs text-gray-400 mt-1">
              All projects are moving forward!
            </p>
          </div>
        ) : (
          staleDeals.map((deal, index) => {
            const urgency = getUrgencyConfig(deal.daysStuck);
            const stageStyle = STAGE_COLORS[deal.stage] || STAGE_COLORS.default;
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => navigate(`/dashboard/projects/${deal.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group/item"
              >
                {/* Days Badge */}
                <div
                  className={`w-11 h-11 rounded-xl ${urgency.bg} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <span className="text-sm font-extrabold text-white leading-none">
                    {deal.daysStuck}
                  </span>
                  <span className="text-[9px] text-white/80 font-medium">
                    days
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover/item:text-orange-600 transition-colors">
                    {deal.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-500 truncate">
                      {deal.company}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-bold text-gray-800">
                      ₹{(deal.value / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                {/* Stage */}
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${stageStyle.bg} ${stageStyle.text}`}
                >
                  {deal.stage}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors"
        >
          Review All Stale Deals <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StaleDealsWidget;
