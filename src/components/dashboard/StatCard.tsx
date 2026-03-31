import React, { useEffect, useState } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  loading?: boolean;
  change?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  sparklineData?: number[];
  animated?: boolean;
}

const iconColorMap: Record<
  string,
  {
    bgClass: string;
    iconGradient: string; // inline CSS gradient – immune to Tailwind purge
    sparkline: string;
    borderClass: string;
  }
> = {
  primary: {
    bgClass: "bg-orange-50/60",
    iconGradient: "linear-gradient(135deg, #f97316, #dc5800)",
    sparkline: "#DC5800",
    borderClass: "border-l-orange-500",
  },
  teal: {
    bgClass: "bg-teal-50/60",
    iconGradient: "linear-gradient(135deg, #2dd4bf, #0d9488)",
    sparkline: "#14B8A6",
    borderClass: "border-l-teal-500",
  },
  olive: {
    bgClass: "bg-emerald-50/60",
    iconGradient: "linear-gradient(135deg, #34d399, #059669)",
    sparkline: "#10B981",
    borderClass: "border-l-emerald-500",
  },
  rose: {
    bgClass: "bg-rose-50/60",
    iconGradient: "linear-gradient(135deg, #fb7185, #e11d48)",
    sparkline: "#F43F5E",
    borderClass: "border-l-rose-500",
  },
  blue: {
    bgClass: "bg-blue-50/60",
    iconGradient: "linear-gradient(135deg, #60a5fa, #2563eb)",
    sparkline: "#3B82F6",
    borderClass: "border-l-blue-500",
  },
  purple: {
    bgClass: "bg-purple-50/60",
    iconGradient: "linear-gradient(135deg, #c084fc, #9333ea)",
    sparkline: "#A855F7",
    borderClass: "border-l-purple-500",
  },
};

const useCountUp = (
  end: number,
  duration: number = 1000,
  enabled: boolean = true,
) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(end);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, enabled]);

  return count;
};

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  loading = false,
  change,
  iconColor = "primary",
  sparklineData,
  animated = true,
}) => {
  const colors = iconColorMap[iconColor] || iconColorMap.primary;

  // Handle count-up animation for numeric values
  const numericValue =
    typeof value === "number"
      ? value
      : parseFloat(value.toString().replace(/[^0-9.-]/g, ""));
  const shouldAnimate =
    animated && !isNaN(numericValue) && typeof value === "number";
  const animatedValue = useCountUp(numericValue, 1500, shouldAnimate);

  const displayValue = shouldAnimate ? animatedValue : value;

  // Transform sparkline data for recharts
  const chartData = sparklineData?.map((val, idx) => ({
    value: val,
    index: idx,
  }));

  return (
    <div
      className={`
        relative bg-white rounded-2xl border border-gray-100 border-l-4 ${colors.borderClass}
        shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden
        cursor-default
      `}
    >
      {/* Subtle background tint */}
      <div className={`absolute inset-0 ${colors.bgClass}`} />

      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-4">
          {loading ? (
            <div className="skeleton w-11 h-11 rounded-xl" />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
              style={{ background: colors.iconGradient }}
            >
              <Icon size={20} className="text-white" strokeWidth={2.5} />
            </div>
          )}
          {!loading && change && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                change.isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {change.isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-8 w-24 rounded-lg" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ) : (
          <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">
            {displayValue}
          </p>
        )}

        {/* Sparkline Chart */}
        {!loading && sparklineData && chartData && (
          <div className="mt-4 -mx-1 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`spark-${iconColor}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={colors.sparkline}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={colors.sparkline}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.sparkline}
                  strokeWidth={2.5}
                  fill={`url(#spark-${iconColor})`}
                  dot={false}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading && <div className="skeleton mt-4 h-12 w-full rounded-md" />}
      </div>
    </div>
  );
};
