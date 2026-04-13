import React, { useMemo } from "react";
import {
  Globe,
  Instagram,
  Users,
  Store,
  Phone,
  MoreHorizontal,
  Mail,
  Megaphone,
} from "lucide-react";
import Card from "../ui/Card";
import { useDashboardStats } from "../../contexts/DashboardStatsContext";

const SOURCE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    barColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  website: {
    label: "Website",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    barColor: "bg-orange-600",
    icon: Globe,
  },
  instagram: {
    label: "Instagram",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    barColor: "bg-pink-600",
    icon: Instagram,
  },
  referral: {
    label: "Referrals",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    barColor: "bg-emerald-600",
    icon: Users,
  },
  walk_in: {
    label: "Walk In",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    barColor: "bg-blue-600",
    icon: Store,
  },
  phone: {
    label: "Phone",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    barColor: "bg-cyan-600",
    icon: Phone,
  },
  email: {
    label: "Email",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    barColor: "bg-indigo-600",
    icon: Mail,
  },
  facebook: {
    label: "Facebook",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    barColor: "bg-blue-700",
    icon: Megaphone,
  },
  other: {
    label: "Others",
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    barColor: "bg-violet-600",
    icon: MoreHorizontal,
  },
};

const normalizeSource = (raw: string): string => {
  const src = raw.toLowerCase();
  if (src.includes("insta")) return "instagram";
  if (src.includes("facebook")) return "facebook";
  if (src.includes("refer")) return "referral";
  if (src.includes("walk")) return "walk_in";
  if (src.includes("site") || src.includes("web")) return "website";
  if (src.includes("phone") || src.includes("call")) return "phone";
  if (src.includes("email")) return "email";
  return SOURCE_CONFIG[src] ? src : "other";
};

export const LeadSourceChart: React.FC = () => {
  const { stats, loading } = useDashboardStats();

  const totalLeads = stats?.leads.total.value ?? 0;

  const data = useMemo(() => {
    const bySource = stats?.leads.bySource.value ?? [];
    const total = bySource.reduce((sum, s) => sum + s.count, 0);

    return bySource
      .map((s) => {
        const key = normalizeSource(s.source);
        const config = SOURCE_CONFIG[key] || SOURCE_CONFIG["other"];
        return {
          key,
          name: config.label,
          value: s.count,
          percentage: total > 0 ? (s.count / total) * 100 : 0,
          config,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  return (
    <Card className="h-full min-h-[450px] flex flex-col overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 md:px-8 pt-6 md:pt-8 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Lead Sources
            </h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Distribution by channel
            </p>
          </div>
          <div className="text-right flex flex-col items-end justify-center">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
                {totalLeads}
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full mt-2">
              Total Leads
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 md:px-8 pb-6 pt-8 overflow-y-auto custom-scrollbar bg-white">
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-1.5 bg-gray-100 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Globe className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">No Data Available</p>
            <p className="text-sm text-gray-500 max-w-[200px]">
              Start adding leads to see source analytics here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((item) => {
              const Icon = item.config.icon;
              return (
                <div key={item.key} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.config.bgColor} ${item.config.color} shadow-sm`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {item.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-lg font-bold text-gray-900 leading-none mb-1">
                        {item.value}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${item.config.barColor}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && data.length > 0 && (
        <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium text-sm">
              Top Source
            </span>
            <span className="font-bold text-gray-900 text-lg mt-0.5">
              {data[0].name}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-gray-500 font-medium text-sm">
              Conversion Share
            </span>
            <span className="font-bold text-gray-900 text-lg mt-0.5">
              {data[0].percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
