import React from "react";
import { X, Activity, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "../../ui";
import { WidgetProps } from "./index";

const MonthlyTrendWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  // Generate last 30 days data
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      day: date.getDate(),
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      revenue: Math.floor(100000 + Math.random() * 200000 + i * 5000),
    };
  });

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = totalRevenue / data.length;
  const lastWeekAvg = data.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7;
  const prevWeekAvg =
    data.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0) / 7;
  const weekGrowth = ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }

  const CustomTooltip: React.FC<TooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-900">
            ₹{(payload[0].value / 1000).toFixed(0)}K
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
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Monthly Revenue Trend
              </h3>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              ₹{(totalRevenue / 100000).toFixed(1)}L
            </p>
            <div
              className={`flex items-center gap-1 text-xs ${weekGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {weekGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {weekGrowth >= 0 ? "+" : ""}
                {weekGrowth.toFixed(1)}% vs last week
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorRevenueTrend"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#14B8A6"
                strokeWidth={2}
                fill="url(#colorRevenueTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">Avg/Day</p>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(avgRevenue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Best Day</p>
            <p className="text-sm font-semibold text-emerald-600">
              ₹{(Math.max(...data.map((d) => d.revenue)) / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Lowest</p>
            <p className="text-sm font-semibold text-orange-600">
              ₹{(Math.min(...data.map((d) => d.revenue)) / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyTrendWidget;
