import React from "react";
import { X, Trophy, TrendingUp, TrendingDown, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { WidgetProps } from "./index";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  dealsClosedThisMonth: number;
  revenueGenerated: number;
  trend: number;
}

const AVATAR_GRADIENTS = [
  "from-yellow-400 to-amber-500",
  "from-slate-400 to-gray-500",
  "from-amber-500 to-orange-500",
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
];

const LeaderboardWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Rahul Kumar",
      avatar: "RK",
      dealsClosedThisMonth: 12,
      revenueGenerated: 8500000,
      trend: 15,
    },
    {
      id: "2",
      name: "Priya Sharma",
      avatar: "PS",
      dealsClosedThisMonth: 10,
      revenueGenerated: 7200000,
      trend: 8,
    },
    {
      id: "3",
      name: "Amit Patel",
      avatar: "AP",
      dealsClosedThisMonth: 8,
      revenueGenerated: 5100000,
      trend: -3,
    },
    {
      id: "4",
      name: "Neha Gupta",
      avatar: "NG",
      dealsClosedThisMonth: 7,
      revenueGenerated: 4800000,
      trend: 12,
    },
    {
      id: "5",
      name: "Vikram Singh",
      avatar: "VS",
      dealsClosedThisMonth: 5,
      revenueGenerated: 3200000,
      trend: -5,
    },
  ];

  const maxRevenue = teamMembers[0].revenueGenerated;

  const getRankLabel = (rank: number) => {
    if (rank === 1) return <Crown className="w-3.5 h-3.5 text-yellow-500" />;
    if (rank === 2)
      return <span className="text-[11px] font-bold text-slate-500">#2</span>;
    if (rank === 3)
      return <span className="text-[11px] font-bold text-amber-600">#3</span>;
    return (
      <span className="text-[11px] font-semibold text-gray-400">#{rank}</span>
    );
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
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Top Performers</h3>
            <p className="text-xs text-gray-400 font-medium">This Month</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-5 space-y-1.5 overflow-y-auto">
        {teamMembers.map((member, index) => {
          const rank = index + 1;
          const barPct = Math.round(
            (member.revenueGenerated / maxRevenue) * 100,
          );
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07, duration: 0.3 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                rank === 1
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Rank */}
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                {getRankLabel(rank)}
              </div>

              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}
              >
                {member.avatar}
              </div>

              {/* Info + Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {member.name}
                  </p>
                  <span
                    className={`text-xs font-bold flex items-center gap-0.5 ml-2 flex-shrink-0 ${
                      member.trend >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {member.trend >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {member.trend >= 0 ? "+" : ""}
                    {member.trend}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{
                        delay: index * 0.07 + 0.2,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className={`h-full rounded-full bg-gradient-to-r ${AVATAR_GRADIENTS[index]}`}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium flex-shrink-0">
                    {member.dealsClosedThisMonth}d · ₹
                    {(member.revenueGenerated / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
