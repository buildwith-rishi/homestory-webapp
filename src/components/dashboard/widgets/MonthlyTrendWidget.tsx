import React, { useEffect, useState, useMemo } from "react";
import { X, Activity, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { WidgetProps } from "./index";
import { getAllPayments } from "../../../services/projectApi";
import type { ProjectPayment } from "../../../types";

const MonthlyTrendWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);
    getAllPayments({
      dateFrom: format(thirtyDaysAgo, "yyyy-MM-dd"),
      dateTo: format(today, "yyyy-MM-dd"),
      limit: 1000,
    })
      .then((res) => setPayments(res.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const today = new Date();
    // Build 30-day bucket map
    const buckets: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      buckets[format(subDays(today, i), "yyyy-MM-dd")] = 0;
    }
    // Sum collected/partially-paid amounts into buckets
    for (const p of payments) {
      const dateStr = p.collectedAt
        ? format(parseISO(p.collectedAt), "yyyy-MM-dd")
        : p.updatedAt
          ? format(parseISO(p.updatedAt), "yyyy-MM-dd")
          : null;
      if (
        dateStr &&
        Object.prototype.hasOwnProperty.call(buckets, dateStr) &&
        (p.status === "COLLECTED" ||
          p.status === "PAID" ||
          p.status === "PARTIALLY_PAID")
      ) {
        const amt =
          typeof p.actualAmount === "string"
            ? parseFloat(p.actualAmount) || 0
            : typeof p.actualAmount === "number"
              ? p.actualAmount
              : typeof p.expectedAmount === "string"
                ? parseFloat(p.expectedAmount) || 0
                : typeof p.expectedAmount === "number"
                  ? p.expectedAmount
                  : 0;
        buckets[dateStr] += amt;
      }
    }
    return Object.entries(buckets).map(([dateStr, revenue]) => {
      const d = parseISO(dateStr);
      return { day: d.getDate(), date: format(d, "M/d"), revenue };
    });
  }, [payments]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;
  const lastWeekRevenue = data.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
  const prevWeekRevenue = data
    .slice(-14, -7)
    .reduce((sum, d) => sum + d.revenue, 0);
  const weekGrowth =
    prevWeekRevenue > 0
      ? ((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100
      : 0;
  const maxDay = Math.max(...data.map((d) => d.revenue), 0);
  const minDay = Math.min(
    ...data.filter((d) => d.revenue > 0).map((d) => d.revenue),
    0,
  );

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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Monthly Revenue Trend
              </h3>
              <p className="text-xs text-gray-400 font-medium">Last 30 days</p>
            </div>
          </div>
          <div className="text-right">
            {loading ? (
              <Loader2 className="w-5 h-5 text-teal-500 animate-spin ml-auto" />
            ) : (
              <>
                <p className="text-2xl font-extrabold text-gray-900 leading-none">
                  ₹{(totalRevenue / 100000).toFixed(1)}L
                </p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-xs font-semibold ${
                    weekGrowth >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {weekGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {weekGrowth >= 0 ? "+" : ""}
                  {weekGrowth.toFixed(1)}% vs last week
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="colorRevenueTrend"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#f0f0f0"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#14B8A6"
              strokeWidth={2.5}
              fill="url(#colorRevenueTrend)"
              activeDot={{
                r: 5,
                fill: "#14B8A6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="mx-4 mb-4 mt-1 grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 rounded-xl border border-gray-100">
        <div className="text-center py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Avg/Day
          </p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">
            ₹{(avgRevenue / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="text-center py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Best Day
          </p>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">
            ₹{(maxDay / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="text-center py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Lowest
          </p>
          <p className="text-sm font-bold text-orange-500 mt-0.5">
            ₹{(minDay / 1000).toFixed(0)}K
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrendWidget;
