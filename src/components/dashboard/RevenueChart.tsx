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

const data = [
  { month: "Jul", revenue: 2840000 },
  { month: "Aug", revenue: 3200000 },
  { month: "Sep", revenue: 2650000 },
  { month: "Oct", revenue: 3800000 },
  { month: "Nov", revenue: 4200000 },
  { month: "Dec", revenue: 3900000 },
  { month: "Jan", revenue: 4520000 },
];

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
  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  const average = total / data.length;
  const growth =
    ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100;

  return (
    <Card className="p-6 animate-scale-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue Overview
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Last 7 months performance
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{(total / 10000000).toFixed(2)}Cr
          </p>
          <p
            className={`text-xs mt-1 ${growth > 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {growth > 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}% vs first
            month
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
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

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-500">Average: </span>
          <span className="font-semibold text-gray-900">
            ₹{(average / 100000).toFixed(1)}L/month
          </span>
        </div>
        <div>
          <span className="text-gray-500">Peak: </span>
          <span className="font-semibold text-gray-900">
            ₹{(Math.max(...data.map((d) => d.revenue)) / 100000).toFixed(1)}L
          </span>
        </div>
      </div>
    </Card>
  );
};
