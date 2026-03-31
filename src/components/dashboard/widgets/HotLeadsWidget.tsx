import React, { useEffect, useState, useMemo } from "react";
import { X, Target, ArrowRight, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "../../ui";
import { WidgetProps } from "./index";
import { listLeads, Lead } from "../../../services/leadApi";

const HotLeadsWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const navigate = useNavigate();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const results: Lead[] = [];
        let page = 1;
        while (true) {
          const res = await listLeads({ limit: 100, page });
          results.push(...res.leads);
          if (results.length >= res.total || res.leads.length < 100) break;
          page++;
          if (page > 5) break; // safety cap
        }
        if (!cancelled) setAllLeads(results);
      } catch {
        if (!cancelled) setAllLeads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  const hotLeads = useMemo(() => {
    return allLeads
      .filter(
        (l) =>
          (l.score !== undefined && l.score >= 70) || l.priority === "high",
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 4);
  }, [allLeads]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-700";
    if (score >= 80) return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <Card className="h-full animate-scale-in group relative !p-0">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              {loading ? (
                <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
              ) : (
                <Target className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                High-Priority Leads
              </h3>
              <p className="text-xs text-gray-500">Score &gt;70%</p>
            </div>
          </div>
          <Badge className="bg-red-100 text-red-700">
            {hotLeads.length} Hot
          </Badge>
        </div>

        {/* Lead List */}
        {hotLeads.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-36 text-sm text-gray-400">
            No high-priority leads right now
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {hotLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {(lead.name || "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {lead.name || "Unknown"}
                    </p>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {lead.propertyType ||
                      lead.projectType ||
                      lead.source ||
                      "—"}
                    {lead.budget
                      ? ` • ₹${(parseFloat(lead.budget) / 100000).toFixed(1)}L`
                      : ""}
                  </p>
                </div>

                {/* Score */}
                <div
                  className={`px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${getScoreColor(lead.score || 0)}`}
                >
                  {lead.score !== undefined
                    ? `${lead.score}%`
                    : lead.priority || "—"}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            onClick={() => navigate("/dashboard/leads")}
          >
            View All Leads <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default HotLeadsWidget;
