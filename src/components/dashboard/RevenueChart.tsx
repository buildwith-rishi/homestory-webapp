import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../ui/Card";
import { useDashboardStats } from "../../contexts/DashboardStatsContext";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900">
          ₹{(payload[0].value / 100000).toFixed(1)}L
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC = () => {
  const { stats, loading } = useDashboardStats();

  // Map monthly breakdown from stats API → chart format
  const data = (stats?.revenue.monthlyBreakdown.value ?? []).map((m) => ({
    month: m.month,
    revenue: m.amount,
  }));

  const total = stats?.revenue.thisYear.value ?? 0;
  const growth = stats?.revenue.growth.value ?? 0;
  const average = data.length > 0
    ? data.reduce((sum, d) => sum + d.revenue, 0) / data.length
    : 0;
  const peak = Math.max(...data.map((d) => d.revenue), 0);

  return (
    <Card className="h-full min-h-[450px] animate-scale-in flex flex-col overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 md:px-8 pt-6 md:pt-8 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Revenue Overview
            </h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Monthly performance this year
            </p>
          </div>
          <div className="text-right flex flex-col items-end justify-center">
            {loading ? (
              <div className="h-10 w-28 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
                    ₹{(total / 10000000).toFixed(2)}Cr
                  </p>
                </div>
                <p
                  className={`text-sm mt-2 font-semibold flex items-center gap-1 ${growth > 0 ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" : growth < 0 ? "text-red-600 bg-red-50 px-2 py-0.5 rounded-full" : "text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full"}`}
                >
                  {growth > 0 ? "↑" : growth < 0 ? "↓" : ""}{" "}
                  {Math.abs(growth).toFixed(1)}% vs last month
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 flex flex-col w-full bg-white mt-8">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC5800" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC5800" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#DC5800"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: "#DC5800", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#DC5800" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium">Average Revenue</span>
            <span className="font-bold text-gray-900 text-lg mt-0.5">
              {loading ? "…" : `₹${(average / 100000).toFixed(1)}L/month`}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-gray-500 font-medium">Peak Revenue</span>
            <span className="font-bold text-gray-900 text-lg mt-0.5">
              {loading ? "…" : `₹${(peak / 100000).toFixed(1)}L`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
