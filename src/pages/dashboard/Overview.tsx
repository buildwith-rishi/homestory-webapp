import React from "react";
import { FolderKanban, Users, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/dashboard/StatCard";
import { WelcomeBanner } from "../../components/dashboard/WelcomeBanner";
import { RevenueChart } from "../../components/dashboard/RevenueChart";
import { LeadSourceChart } from "../../components/dashboard/LeadSourceChart";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { Card, Button, Badge, Progress } from "../../components/ui";

export const DashboardOverview: React.FC = () => {
  // Sparkline data for stat cards (last 7 days)
  const projectsSparkline = [18, 20, 19, 22, 21, 23, 24];
  const leadsSparkline = [58, 62, 59, 65, 63, 67, 68];
  const revenueSparkline = [38, 41, 39, 43, 42, 44, 45];
  const meetingsSparkline = [4, 6, 5, 7, 6, 4, 5];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={24}
          change={{ value: 12, isPositive: true }}
          iconColor="primary"
          sparklineData={projectsSparkline}
          animated={true}
        />
        <StatCard
          icon={Users}
          label="Total Leads"
          value={68}
          change={{ value: 8, isPositive: true }}
          iconColor="teal"
          sparklineData={leadsSparkline}
          animated={true}
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue This Month"
          value="₹45.2L"
          change={{ value: 15, isPositive: true }}
          iconColor="olive"
          sparklineData={revenueSparkline}
        />
        <StatCard
          icon={Calendar}
          label="Meetings Today"
          value={5}
          iconColor="rose"
          sparklineData={meetingsSparkline}
          animated={true}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <LeadSourceChart />
        </div>
      </div>

      {/* Projects and Activity Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="animate-scale-in">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Projects
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Track your ongoing projects
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  name: "Modern 3BHK - Sharma Family",
                  stage: "Design",
                  progress: 65,
                  color: "bg-blue-500",
                },
                {
                  name: "Luxury Villa - Kumar Residence",
                  stage: "Execution",
                  progress: 40,
                  color: "bg-orange-500",
                },
                {
                  name: "Contemporary 2BHK - Patel Home",
                  stage: "Material",
                  progress: 75,
                  color: "bg-purple-500",
                },
              ].map((project, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>
                    <Badge>{project.stage}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Progress value={project.progress} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {project.progress}% Complete
                      </span>
                      <span className="text-gray-500">Due in 12 days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="animate-scale-in">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Today's Meetings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Your schedule for today
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View Calendar →
              </Button>
            </div>
            <div className="p-6 space-y-3">
              {[
                {
                  time: "10:00 AM",
                  client: "Rajesh Kumar",
                  type: "Site Visit",
                  status: "Upcoming",
                  avatar: "RK",
                },
                {
                  time: "2:30 PM",
                  client: "Priya Sharma",
                  type: "Design Review",
                  status: "Upcoming",
                  avatar: "PS",
                },
                {
                  time: "4:00 PM",
                  client: "Amit Patel",
                  type: "Consultation",
                  status: "In Progress",
                  avatar: "AP",
                },
              ].map((meeting, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                    {meeting.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {meeting.time} - {meeting.client}
                    </p>
                    <p className="text-sm text-gray-600">{meeting.type}</p>
                  </div>
                  <Badge
                    variant={
                      meeting.status === "In Progress" ? "info" : "neutral"
                    }
                  >
                    {meeting.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <ActivityFeed />
          <Card>
            <div className="p-6 border-b border-ash/10">
              <h2 className="font-display text-display-sm text-secondary">
                Lead Pipeline
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {[
                { stage: "New", count: 32, color: "ash" },
                { stage: "Qualified", count: 18, color: "teal" },
                { stage: "Meeting", count: 8, color: "olive" },
                { stage: "Proposal", count: 5, color: "primary" },
                { stage: "Won", count: 3, color: "teal" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-body text-sm text-secondary">
                    {item.stage}
                  </span>
                  <span className="font-body font-medium text-secondary">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-ash/10">
              <h2 className="font-display text-display-sm text-secondary">
                Quick Actions
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <Calendar size={20} />
                <span className="text-xs">Schedule Meeting</span>
              </Button>
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <Users size={20} />
                <span className="text-xs">Add Lead</span>
              </Button>
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <FolderKanban size={20} />
                <span className="text-xs">New Project</span>
              </Button>
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <TrendingUp size={20} />
                <span className="text-xs">Send Update</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
