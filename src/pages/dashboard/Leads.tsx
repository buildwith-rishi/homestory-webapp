import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  MapPin,
  DollarSign,
  User,
  X,
  Activity,
  Trash2,
} from "lucide-react";
import { Card, Button, Badge, Progress } from "../../components/ui";
import {
  getActivityLog,
  clearActivityLog,
  type KanbanActivityEntry,
} from "../../stores/kanbanActivityLog";

const stages = ["New", "Qualified", "Meeting", "Proposal", "Won"];

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  propertyType: string;
  location: string;
  budget: string;
  source: string;
  stage: string;
  score: number;
  lastContact: string;
  priority: "high" | "medium" | "low";
  notes?: string;
  followUp?: string;
}

const mockLeads: Lead[] = [
  {
    id: 1,
    name: "Ramesh Iyer",
    phone: "+91 98765 43210",
    email: "ramesh@example.com",
    propertyType: "3BHK Apartment",
    location: "HSR Layout",
    budget: "₹25-30L",
    source: "Instagram",
    stage: "Meeting",
    score: 85,
    lastContact: "2 hours ago",
    priority: "high",
    followUp: "Tomorrow, 10:00 AM",
    notes: "Looking for modern interior design with smart home integration.",
  },
  {
    id: 2,
    name: "Sneha Reddy",
    phone: "+91 98123 45678",
    email: "sneha@example.com",
    propertyType: "4BHK Villa",
    location: "Whitefield",
    budget: "₹50-60L",
    source: "Website",
    stage: "Proposal",
    score: 92,
    lastContact: "1 day ago",
    priority: "high",
    followUp: "Today, 3:00 PM",
    notes: "Premium villa project, budget flexible.",
  },
];

const stageColors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 border-gray-200",
  Qualified: "bg-blue-100 text-blue-700 border-blue-200",
  Meeting: "bg-purple-100 text-purple-700 border-purple-200",
  Proposal: "bg-orange-100 text-orange-700 border-orange-200",
  Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/**
 * Format a date as relative time (e.g. "2 minutes ago", "1 hour ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const LeadsPage: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [activityLog, setActivityLog] = useState<KanbanActivityEntry[]>([]);

  // Load activity log on mount and refresh periodically
  useEffect(() => {
    setActivityLog(getActivityLog());
    const interval = setInterval(() => {
      setActivityLog(getActivityLog());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const leadCounts = {
    New: 1,
    Qualified: 0,
    Meeting: 1,
    Proposal: 1,
    Won: 0,
  };

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch = lead.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStage =
      selectedStage === "all" || lead.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads & CRM</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales pipeline effectively
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="rounded-xl">
            <Filter className="w-4 h-4" />
            Export
          </Button>
          <Button className="rounded-xl">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stages.map((stage) => (
          <Card
            key={stage}
            className={`p-4 rounded-xl text-center cursor-pointer transition-all hover:shadow-md ${
              selectedStage === stage ? "ring-2 ring-orange-500 shadow-md" : ""
            }`}
            onClick={() =>
              setSelectedStage(selectedStage === stage ? "all" : stage)
            }
          >
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {leadCounts[stage as keyof typeof leadCounts]}
            </div>
            <div className="text-sm font-medium text-gray-600">{stage}</div>
          </Card>
        ))}
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search leads..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => {
          return (
            <Card
              key={lead.id}
              className="p-5 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                    {lead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                    <Badge
                      className={`text-xs rounded-lg mt-1 ${stageColors[lead.stage]}`}
                    >
                      {lead.stage}
                    </Badge>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Lead Score</span>
                  <span className="font-semibold">{lead.score}/100</span>
                </div>
                <Progress value={lead.score} />
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {lead.propertyType}, {lead.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{lead.budget}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Kanban Activity Log */}
      {activityLog.length > 0 && (
        <Card className="p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Kanban Activity Log
              </h2>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                {activityLog.length}
              </span>
            </div>
            <button
              onClick={() => {
                clearActivityLog();
                setActivityLog([]);
              }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {activityLog.map((entry) => {
              const time = new Date(entry.timestamp);
              const relativeTime = getRelativeTime(time);
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{entry.cardTitle}</span>{" "}
                      added to{" "}
                      <span className="font-medium text-purple-700">
                        {entry.columnName}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {relativeTime}
                      </span>
                      {entry.priority && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            entry.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : entry.priority === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {entry.priority}
                        </span>
                      )}
                      {entry.assignedTo && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {selectedLead &&
        ReactDOM.createPortal(
          <>
            {/* Backdrop - covers entire viewport */}
            <div
              onClick={() => setSelectedLead(null)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(17, 24, 39, 0.5)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                zIndex: 9998,
              }}
            />
            {/* Sidebar */}
            <div
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                maxWidth: "448px",
                zIndex: 9999,
                backgroundColor: "white",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "auto",
              }}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Lead Details</h2>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {selectedLead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <h3 className="text-xl font-bold">{selectedLead.name}</h3>
                  <Badge
                    className={`mt-2 rounded-lg ${stageColors[selectedLead.stage]}`}
                  >
                    {selectedLead.stage}
                  </Badge>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};
