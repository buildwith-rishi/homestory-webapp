import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  MapPin,
  DollarSign,
  Clock,
  Star,
  User,
  TrendingUp,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, Button, Badge, Progress } from "../../components/ui";

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

const priorityColors: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  high: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  low: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

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
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => navigate("/dashboard/leads/kanban")}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban View
          </Button>
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
          const priorityColor = priorityColors[lead.priority];
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
