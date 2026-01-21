import React from "react";
import { X, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "../../ui";
import { WidgetProps } from "./index";

const LeadSourceWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const data = [
    { name: "Website", value: 145, color: "#DC5800" },
    { name: "Referrals", value: 98, color: "#F59E0B" },
    { name: "Social Media", value: 76, color: "#10B981" },
    { name: "Direct", value: 54, color: "#3B82F6" },
    { name: "Others", value: 32, color: "#8B5CF6" },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

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
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Lead Sources
              </h3>
              <p className="text-xs text-gray-500">Distribution by channel</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-2 space-y-1.5">
          {data.map((entry) => {
            const percentage = ((entry.value / total) * 100).toFixed(0);
            return (
              <div
                key={entry.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 font-medium">
                    {entry.value}
                  </span>
                  <span className="text-gray-400 w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default LeadSourceWidget;
