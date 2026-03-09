import React, { useEffect, useState, useMemo } from "react";
import { X, BarChart3, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { WidgetProps } from "./index";
import { listLeads, Lead } from "../../../services/leadApi";

interface FunnelStage {
  name: string;
  count: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  percentage: number;
}

const STAGE_CONFIG: Array<{
  label: string;
  keys: string[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
}> = [
  {
    label: "New Leads",
    keys: ["NEW_LEAD", "NEW", "CONTACTED", "OPEN", "FRESH"],
    color: "#3B82F6",
    gradientFrom: "from-blue-400",
    gradientTo: "to-blue-600",
  },
  {
    label: "Qualified",
    keys: ["QUALIFIED", "INTERESTED"],
    color: "#06B6D4",
    gradientFrom: "from-cyan-400",
    gradientTo: "to-cyan-600",
  },
  {
    label: "Meeting",
    keys: ["MEETING_SCHEDULED", "MEETING", "SITE_VISIT", "FOLLOW_UP"],
    color: "#8B5CF6",
    gradientFrom: "from-violet-400",
    gradientTo: "to-purple-600",
  },
  {
    label: "Proposal",
    keys: ["PROPOSAL_SENT", "PROPOSAL", "NEGOTIATION", "QUOTATION_SENT"],
    color: "#F59E0B",
    gradientFrom: "from-amber-400",
    gradientTo: "to-orange-500",
  },
  {
    label: "Won",
    keys: ["WON", "CONVERTED", "CLOSED_WON"],
    color: "#10B981",
    gradientFrom: "from-emerald-400",
    gradientTo: "to-emerald-600",
  },
];

const SalesPipelineWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const results: Lead[] = [];
        let page = 1;
        while (true) {
          const res = await listLeads({ limit: 200, page });
          results.push(...res.leads);
          if (results.length >= res.total || res.leads.length < 200) break;
          page++;
        }
        if (!cancelled) setLeads(results);
      } catch {
        if (!cancelled) setLeads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const stages: FunnelStage[] = useMemo(() => {
    const counts = STAGE_CONFIG.map((cfg) => {
      const count = leads.filter((l) => {
        const val = ((l.stage || l.status || "") as string).toUpperCase();
        return cfg.keys.some((k) => val === k || val.startsWith(k));
      }).length;
      return { ...cfg, count };
    });
    const maxCount = counts[0]?.count || 1;
    return counts.map((s) => ({ ...s, name: s.label, percentage: maxCount > 0 ? Math.round((s.count / maxCount) * 100) : 0 }));
  }, [leads]);

  const conversionRate = stages[0]?.count > 0
    ? Math.round(((stages[4]?.count || 0) / stages[0].count) * 100)
    : 0;
  const totalLeads = leads.length;

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
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Sales Pipeline</h3>
            <p className="text-xs text-gray-400 font-medium">Funnel Overview</p>
          </div>
          {loading && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
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
        <div
          className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => navigate("/dashboard/leads")}
        >
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
            Total Leads
          </p>
          <p className="text-xl font-extrabold text-blue-700 leading-tight mt-0.5">
            {totalLeads}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesPipelineWidget;
