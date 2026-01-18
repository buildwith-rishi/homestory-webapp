import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Card from "../ui/Card";

const data = [
  { name: "Website", value: 145, color: "#DC5800" },
  { name: "Referrals", value: 98, color: "#F59E0B" },
  { name: "Social Media", value: 76, color: "#10B981" },
  { name: "Direct", value: 54, color: "#3B82F6" },
  { name: "Others", value: 32, color: "#8B5CF6" },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percentage = ((payload[0].value / total) * 100).toFixed(1);

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
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6 animate-scale-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
        <p className="text-sm text-gray-500 mt-1">Distribution by channel</p>
      </div>

      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900 text-2xl font-bold"
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

      <CustomLegend payload={data} />

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Top Source:</span>
          <span className="font-semibold text-gray-900">
            {data[0].name} ({((data[0].value / total) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </Card>
  );
};
