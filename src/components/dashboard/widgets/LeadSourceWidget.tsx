import React, { useEffect, useState, useMemo } from "react";
import { X, TrendingUp, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { WidgetProps } from "./index";
import { listLeads, Lead } from "../../../services/leadApi";

const SOURCE_CONFIG: Array<{ label: string; keys: string[]; color: string }> = [
  { label: "Website", keys: ["WEBSITE", "WEB", "ONLINE"], color: "#DC5800" },
  {
    label: "Referrals",
    keys: ["REFERRAL", "REFERRALS", "REFERENCE"],
    color: "#F59E0B",
  },
  {
    label: "Social Media",
    keys: ["SOCIAL_MEDIA", "SOCIAL", "INSTAGRAM", "FACEBOOK", "LINKEDIN"],
    color: "#10B981",
  },
  {
    label: "Direct",
    keys: ["DIRECT", "WALK_IN", "COLD_CALL"],
    color: "#3B82F6",
  },
];

const LeadSourceWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
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
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    let othersCount = 0;
    leads.forEach((l) => {
      const src = (l.source || "").toUpperCase();
      const cfg = SOURCE_CONFIG.find((c) =>
        c.keys.some((k) => src === k || src.includes(k)),
      );
      if (cfg) {
        counts[cfg.label] = (counts[cfg.label] || 0) + 1;
      } else {
        othersCount++;
      }
    });
    const result = SOURCE_CONFIG.map((c) => ({
      name: c.label,
      value: counts[c.label] || 0,
      color: c.color,
    })).filter((d) => d.value > 0);
    if (othersCount > 0)
      result.push({ name: "Others", value: othersCount, color: "#8B5CF6" });
    return result.sort((a, b) => b.value - a.value);
  }, [leads]);

  const total = data.reduce((s, d) => s + d.value, 0) || leads.length;

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      payload: { color: string };
    }>;
  }

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: payload[0].payload.color }}
            />
            <span className="text-xs text-gray-600 font-medium">
              {payload[0].name}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 mt-1">
            {payload[0].value} leads ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
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

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Lead Sources</h3>
            <p className="text-xs text-gray-400 font-medium">
              Distribution by channel
            </p>
          </div>
          {loading && (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Donut Chart with center label */}
      {data.length === 0 && !loading ? (
        <div className="flex-1 flex items-center justify-center text-center px-5">
          <p className="text-sm text-gray-400">No leads data available</p>
        </div>
      ) : (
        <>
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-extrabold text-gray-900 leading-none">
                {total}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Total
              </p>
            </div>
          </div>

          {/* Legend with bars */}
          <div className="flex-1 px-5 pb-5 space-y-2">
            {data.map((entry) => {
              const pct =
                total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-600 w-20 flex-shrink-0">
                    {entry.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: entry.color }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 w-7 text-right flex-shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LeadSourceWidget;
