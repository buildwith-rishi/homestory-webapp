import React from "react";
import { X, Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../ui";
import { WidgetProps } from "./index";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  dealsClosedThisMonth: number;
  revenueGenerated: number;
  trend: number;
}

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return (
          <span className="text-xs font-medium text-gray-400">#{rank}</span>
        );
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-white border-gray-100";
    }
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Top Performers
              </h3>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {teamMembers.map((member, index) => {
            const rank = index + 1;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all hover:shadow-sm ${getRankBg(rank)}`}
              >
                {/* Rank */}
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                    rank === 1
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : rank === 2
                        ? "bg-gradient-to-br from-gray-400 to-slate-500"
                        : rank === 3
                          ? "bg-gradient-to-br from-amber-400 to-orange-500"
                          : "bg-gradient-to-br from-blue-400 to-blue-600"
                  }`}
                >
                  {member.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.dealsClosedThisMonth} deals • ₹
                    {(member.revenueGenerated / 100000).toFixed(1)}L
                  </p>
                </div>

                {/* Trend */}
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${member.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  <TrendingUp
                    className={`w-3 h-3 ${member.trend < 0 ? "rotate-180" : ""}`}
                  />
                  {member.trend >= 0 ? "+" : ""}
                  {member.trend}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default LeaderboardWidget;
