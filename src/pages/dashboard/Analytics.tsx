import React from 'react';
import { TrendingUp, DollarSign, Users, Briefcase, BarChart3, Activity } from 'lucide-react';
import { Card } from '../../components/ui';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 2800000, target: 3000000, projects: 4 },
  { month: 'Feb', revenue: 3200000, target: 3000000, projects: 5 },
  { month: 'Mar', revenue: 2900000, target: 3000000, projects: 3 },
  { month: 'Apr', revenue: 3500000, target: 3500000, projects: 6 },
  { month: 'May', revenue: 3800000, target: 3500000, projects: 5 },
  { month: 'Jun', revenue: 4200000, target: 4000000, projects: 7 },
];

const conversionData = [
  { stage: 'Leads', count: 145 },
  { stage: 'Qualified', count: 98 },
  { stage: 'Meetings', count: 67 },
  { stage: 'Proposals', count: 45 },
  { stage: 'Won', count: 24 },
];

const teamPerformance = [
  { member: 'Arjun', projects: 8, revenue: 4200000 },
  { member: 'Priya', projects: 6, revenue: 3800000 },
  { member: 'Rahul', projects: 5, revenue: 3200000 },
  { member: 'Sneha', projects: 4, revenue: 2900000 },
];

export const Analytics: React.FC = () => {
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgConversion = Math.round((conversionData[conversionData.length - 1].count / conversionData[0].count) * 100);
  const totalProjects = revenueData.reduce((sum, d) => sum + d.projects, 0);
  const teamSize = teamPerformance.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600 mt-1">Track performance metrics and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{(totalRevenue / 10000000).toFixed(1)}Cr</p>
              <p className="text-xs text-emerald-600 mt-1">+12.5% vs last period</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgConversion}%</p>
              <p className="text-xs text-emerald-600 mt-1">+3.2% improvement</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalProjects}</p>
              <p className="text-xs text-blue-600 mt-1">6 active now</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{teamSize}</p>
              <p className="text-xs text-purple-600 mt-1">All active</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Revenue vs Target
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#DC5800" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="target" stroke="#3b82f6" fill="url(#colorTarget)" strokeWidth={2} name="Target" />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC5800" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC5800" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Conversion Funnel
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={conversionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis dataKey="stage" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#DC5800" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
        <div className="space-y-4">
          {teamPerformance.map((member, index) => (
            <div key={member.member} className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                  {member.member.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{member.member}</h4>
                    <span className="text-sm text-gray-600">{member.projects} projects • ₹{(member.revenue / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${(member.revenue / 4200000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Project Success Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">92%</p>
          <p className="text-sm text-gray-600">Projects delivered on time</p>
        </Card>
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Customer Satisfaction</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">4.8/5</p>
          <p className="text-sm text-gray-600">Average client rating</p>
        </Card>
        <Card className="p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Growth Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">+28%</p>
          <p className="text-sm text-gray-600">Year over year</p>
        </Card>
      </div>
    </div>
  );
};
