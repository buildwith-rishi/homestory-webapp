import React, { useEffect, useState } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
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
  { bg: string; text: string; sparkline: string }
> = {
  primary: { bg: "bg-primary/10", text: "text-primary", sparkline: "#DC5800" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-600", sparkline: "#14B8A6" },
  olive: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    sparkline: "#10B981",
  },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600", sparkline: "#F43F5E" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", sparkline: "#3B82F6" },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    sparkline: "#A855F7",
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
    <Card className="p-6 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
          >
            <Icon size={24} className={colors.text} strokeWidth={2} />
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                change.isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {change.isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {displayValue}
          </p>
        </div>

        {/* Sparkline Chart */}
        {sparklineData && chartData && (
          <div className="mt-3 -mb-2 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.sparkline}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};
