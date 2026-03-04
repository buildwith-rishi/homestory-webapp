import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Card from "../ui/Card";
import { listLeads } from "../../services/leadApi";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  website: { label: "Website", color: "#DC5800" },
  instagram: { label: "Instagram", color: "#F59E0B" },
  referral: { label: "Referrals", color: "#10B981" },
  walk_in: { label: "Walk In", color: "#3B82F6" },
  other: { label: "Others", color: "#8B5CF6" },
};

const COLORS = ["#DC5800", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  total = 0,
}: CustomTooltipProps & { total?: number }) => {
  if (active && payload && payload.length) {
    const percentage =
      total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : "0";

    return (
      <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: payload[0].payload.color }}
          />
          <span className="text-xs text-gray-600">{payload[0].name}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {payload[0].value} leads ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

interface LegendEntry {
  name: string;
  value: number;
  color: string;
}

const CustomLegend = ({ payload }: { payload: LegendEntry[] }) => {
  const total = payload.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="mt-4 space-y-2">
      {payload.map((entry: LegendEntry, index: number) => {
        const percentage = ((entry.value / total) * 100).toFixed(0);
        return (
          <div
            key={index}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700">{entry.value}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-900 font-medium">{entry.name}</span>
              <span className="text-gray-500 min-w-[40px] text-right">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LeadSourceChart: React.FC = () => {
  const [data, setData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        // Fetch all leads (large limit to get full source distribution)
        const res = await listLeads({ limit: 1000 });
        const leads = res.leads || [];

        // Group by source
        const counts: Record<string, number> = {};
        leads.forEach((lead) => {
          const src = (lead.source || "other").toLowerCase();
          counts[src] = (counts[src] || 0) + 1;
        });

        // Build chart data ordered by SOURCE_CONFIG keys
        const orderedKeys = Object.keys(SOURCE_CONFIG);
        const dynamicEntries = Object.entries(counts)
          .filter(([k]) => !orderedKeys.includes(k.toLowerCase()))
          .map(([k, v], i) => ({
            name: k.charAt(0).toUpperCase() + k.slice(1),
            value: v,
            color: COLORS[i % COLORS.length],
          }));

        const builtData = [
          ...orderedKeys
            .filter((k) => counts[k] > 0)
            .map((k) => ({
              name: SOURCE_CONFIG[k].label,
              value: counts[k],
              color: SOURCE_CONFIG[k].color,
            })),
          ...dynamicEntries,
        ].sort((a, b) => b.value - a.value);

        setData(builtData);
      } catch (err) {
        console.error("LeadSourceChart fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6 animate-scale-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
        <p className="text-sm text-gray-500 mt-1">Distribution by channel</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={
                  data.length > 0
                    ? data
                    : [{ name: "No Data", value: 1, color: "#E5E7EB" }]
                }
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {(data.length > 0 ? data : [{ color: "#E5E7EB" }]).map(
                  (entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ),
                )}
              </Pie>
              <Tooltip content={<CustomTooltip total={total} />} />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-900 text-2xl font-bold"
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  fill: "#111827",
                }}
              >
                {total}
              </text>
              <text
                x="50%"
                y="50%"
                dy={20}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-500 text-xs"
              >
                Total Leads
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && data.length > 0 && <CustomLegend payload={data} />}

      {!loading && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Top Source:</span>
            <span className="font-semibold text-gray-900">
              {data.length > 0
                ? `${data[0].name} (${((data[0].value / total) * 100).toFixed(0)}%)`
                : "No data"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
