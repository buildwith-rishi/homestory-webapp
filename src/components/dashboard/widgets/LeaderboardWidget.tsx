import React, { useEffect, useState, useMemo } from "react";
import { X, Trophy, Crown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { WidgetProps } from "./index";
import {
  getAllTeamMembers,
  TeamMember as ApiTeamMember,
} from "../../../services/teamApi";
import { useProjectStore } from "../../../stores/projectStore";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  projectCount: number;
  revenueGenerated: number;
}

const AVATAR_GRADIENTS = [
  "from-yellow-400 to-amber-500",
  "from-slate-400 to-gray-500",
  "from-amber-500 to-orange-500",
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
];

const LeaderboardWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [apiMembers, setApiMembers] = useState<ApiTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { projects } = useProjectStore();

  useEffect(() => {
    getAllTeamMembers()
      .then(setApiMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const teamMembers = useMemo<LeaderboardEntry[]>(() => {
    const scored = apiMembers.map((member) => {
      const mid = member.userId || member.id;
      const assignedProjects = projects.filter(
        (p) => p.assignedPMId === mid || p.assignedDesignerId === mid,
      );
      const revenue = assignedProjects.reduce((sum, p) => {
        const val =
          typeof p.totalValue === "string"
            ? parseFloat(p.totalValue) || 0
            : p.totalValue || 0;
        return sum + val;
      }, 0);
      return {
        id: member.id,
        name: member.name,
        avatar: member.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        projectCount: assignedProjects.length,
        revenueGenerated: revenue,
      };
    });
    return scored
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .slice(0, 5);
  }, [apiMembers, projects]);

  const maxRevenue = teamMembers[0]?.revenueGenerated || 1;

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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
            No team data available
          </div>
        ) : (
          teamMembers.map((member, index) => {
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
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                    AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                  } flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}
                >
                  {member.avatar}
                </div>

                {/* Info + Bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {member.name}
                  </p>
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
                        className={`h-full rounded-full bg-gradient-to-r ${
                          AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium flex-shrink-0">
                      {member.projectCount}p · ₹
                      {(member.revenueGenerated / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
