import React, { useState, useEffect } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
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
import { getAllPayments } from "../../services/projectApi";

// Fallback placeholder shown during loading
const PLACEHOLDER_DATA = Array.from({ length: 7 }, (_, i) => ({
  month: format(subMonths(new Date(), 6 - i), "MMM"),
  revenue: 0,
}));

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
  const [data, setData] = useState(PLACEHOLDER_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      try {
        // Fetch payments for the last 7 months
        const dateFrom = startOfMonth(subMonths(new Date(), 6)).toISOString();
        const dateTo = endOfMonth(new Date()).toISOString();
        const res = await getAllPayments({ dateFrom, dateTo, limit: 1000 });
        const payments = res.payments || [];

        // Build last 7 months buckets
        const buckets: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const key = format(subMonths(new Date(), i), "MMM yyyy");
          buckets[key] = 0;
        }

        // Sum collected payments into their month bucket
        payments.forEach((p) => {
          const statusUp = (p.status || "").toUpperCase();
          if (statusUp !== "COLLECTED" && statusUp !== "PARTIALLY_PAID") return;
          const dateStr = p.collectedAt || p.collectedDate || p.createdAt;
          if (!dateStr) return;
          const key = format(parseISO(dateStr), "MMM yyyy");
          if (key in buckets) {
            const amount = Number(
              p.actualAmount ?? p.invoiceAmount ?? p.amount ?? 0,
            );
            buckets[key] += amount;
          }
        });

        const chartData = Object.entries(buckets).map(
          ([monthYear, revenue]) => ({
            month: monthYear.split(" ")[0], // Short month name
            revenue,
          }),
        );
        setData(chartData);
      } catch (err) {
        console.error("RevenueChart fetch failed:", err);
        // Keep placeholder zeros
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  const total = data.reduce((sum, item) => sum + item.revenue, 0);
  const average = data.length > 0 ? total / data.length : 0;
  const firstRevenue = data[0]?.revenue || 0;
  const lastRevenue = data[data.length - 1]?.revenue || 0;
  const growth =
    firstRevenue === 0
      ? 0
      : ((lastRevenue - firstRevenue) / firstRevenue) * 100;

  return (
    <Card className="h-full min-h-[450px] animate-scale-in flex flex-col overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 md:px-8 pt-6 md:pt-8 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Revenue Overview
            </h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Last 7 months performance
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
                  {growth > 0 ? "↑" : growth < 0 ? "↓" : ""} {Math.abs(growth).toFixed(1)}% vs first month
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
              {loading
                ? "…"
                : `₹${(Math.max(...data.map((d) => d.revenue), 0) / 100000).toFixed(1)}L`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
