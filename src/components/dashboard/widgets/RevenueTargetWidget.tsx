import React, { useEffect, useState, useMemo } from "react";
import { X, Target, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { WidgetProps } from "./index";
import { getAllPayments, ProjectPayment } from "../../../services/projectApi";

const RevenueTargetWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [thisMonthPayments, setThisMonthPayments] = useState<ProjectPayment[]>(
    [],
  );
  const [lastMonthPayments, setLastMonthPayments] = useState<ProjectPayment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const thisStart = format(startOfMonth(today), "yyyy-MM-dd");
    const thisEnd = format(endOfMonth(today), "yyyy-MM-dd");
    const lastMonthDate = subMonths(today, 1);
    const lastStart = format(startOfMonth(lastMonthDate), "yyyy-MM-dd");
    const lastEnd = format(endOfMonth(lastMonthDate), "yyyy-MM-dd");

    Promise.all([
      getAllPayments({ dateFrom: thisStart, dateTo: thisEnd, limit: 500 }),
      getAllPayments({ dateFrom: lastStart, dateTo: lastEnd, limit: 500 }),
    ])
      .then(([thisP, lastP]) => {
        if (!cancelled) {
          setThisMonthPayments(thisP);
          setLastMonthPayments(lastP);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThisMonthPayments([]);
          setLastMonthPayments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const COLLECTED_STATUSES = ["COLLECTED", "PAID"];

  const currentRevenue = useMemo(() => {
    return thisMonthPayments
      .filter((p) =>
        COLLECTED_STATUSES.includes((p.status || "").toUpperCase()),
      )
      .reduce(
        (sum, p) =>
          sum +
          (parseFloat(String(p.actualAmount || p.expectedAmount || 0)) || 0),
        0,
      );
  }, [thisMonthPayments]);

  const targetRevenue = useMemo(() => {
    const total = thisMonthPayments.reduce(
      (sum, p) =>
        sum +
        (parseFloat(String(p.expectedAmount || p.actualAmount || 0)) || 0),
      0,
    );
    // target = max of pipeline total or current, minimum ₹1L to avoid division by zero
    return Math.max(total, currentRevenue, 100000);
  }, [thisMonthPayments, currentRevenue]);

  const lastMonthRevenue = useMemo(() => {
    return lastMonthPayments
      .filter((p) =>
        COLLECTED_STATUSES.includes((p.status || "").toUpperCase()),
      )
      .reduce(
        (sum, p) =>
          sum +
          (parseFloat(String(p.actualAmount || p.expectedAmount || 0)) || 0),
        0,
      );
  }, [lastMonthPayments]);

  const percentage = Math.min(
    100,
    Math.round((currentRevenue / targetRevenue) * 100),
  );
  const growth =
    lastMonthRevenue > 0
      ? (
          ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) *
          100
        ).toFixed(1)
      : null;

  // SVG semi-circle gauge
  const radius = 54;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  const getColorConfig = () => {
    if (percentage >= 90)
      return {
        stroke: "#10B981",
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
        label: "On Track 🎉",
      };
    if (percentage >= 70)
      return {
        stroke: "#F59E0B",
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
        label: `${100 - percentage}% to go`,
      };
    return {
      stroke: "#EF4444",
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      label: `${100 - percentage}% to go`,
    };
  };

  const colorConfig = getColorConfig();

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">
              Revenue vs Target
            </h3>
            <p className="text-xs text-gray-400 font-medium">This Month</p>
          </div>
          {loading && (
            <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
          )}
        </div>
      </div>

      {/* SVG Gauge */}
      <div className="flex-shrink-0 flex flex-col items-center pb-2">
        <div className="relative">
          <svg width="140" height="80" viewBox="0 0 140 80">
            {/* Track */}
            <path
              d="M 10 75 A 60 60 0 0 1 130 75"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Progress */}
            <motion.path
              d="M 10 75 A 60 60 0 0 1 130 75"
              fill="none"
              stroke={colorConfig.stroke}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
          {/* Center Content */}
          <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center">
            <span
              className={`text-3xl font-extrabold leading-none ${colorConfig.text}`}
            >
              {percentage}%
            </span>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
              of target
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Values */}
      <div className="px-5 pb-2">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-400 font-medium">₹0</span>
          <span className="text-gray-400 font-medium">
            ₹{(targetRevenue / 100000).toFixed(0)}L target
          </span>
        </div>
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: colorConfig.stroke }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-extrabold text-gray-900">
            ₹{(currentRevenue / 100000).toFixed(1)}L earned
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorConfig.bg} ${colorConfig.border} border ${colorConfig.text}`}
          >
            {colorConfig.label}
          </span>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mx-4 mt-2 mb-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Last Month
          </p>
          <p className="text-base font-extrabold text-gray-800 leading-tight mt-0.5">
            {lastMonthRevenue > 0
              ? `₹${(lastMonthRevenue / 100000).toFixed(1)}L`
              : "—"}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">
              Growth
            </p>
          </div>
          <p
            className={`text-base font-extrabold leading-tight mt-0.5 ${
              growth === null
                ? "text-gray-400"
                : parseFloat(growth) >= 0
                  ? "text-emerald-700"
                  : "text-red-600"
            }`}
          >
            {growth === null
              ? "—"
              : `${parseFloat(growth) >= 0 ? "+" : ""}${growth}%`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueTargetWidget;
