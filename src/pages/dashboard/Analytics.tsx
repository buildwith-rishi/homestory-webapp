import React, { useState } from 'react';
import { TrendingUp, DollarSign, Users, Briefcase, BarChart3, Activity, Clock, Target, PhoneCall, Award, TrendingDown } from 'lucide-react';
import { Card, Badge, Select } from '../../components/ui';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

// Enhanced BDR Performance Data
const bdrComparison = [
  {
    id: 1,
    name: 'Arjun',
    avatar: 'AR',
    totalLeads: 145,
    convertedLeads: 32,
    conversionRate: 22.1,
    avgResponseTime: '8 mins',
    responseTimeValue: 8,
    totalCalls: 287,
    meetingsBooked: 48,
    revenue: 4200000,
    projects: 8,
    activeDeals: 12,
    avgDealSize: 525000,
    rank: 1,
    trend: 'up',
    trendValue: 15.2,
    lastMonthConversion: 19.5,
  },
  {
    id: 2,
    name: 'Priya',
    avatar: 'PR',
    totalLeads: 132,
    convertedLeads: 28,
    conversionRate: 21.2,
    avgResponseTime: '12 mins',
    responseTimeValue: 12,
    totalCalls: 254,
    meetingsBooked: 42,
    revenue: 3800000,
    projects: 6,
    activeDeals: 10,
    avgDealSize: 633333,
    rank: 2,
    trend: 'up',
    trendValue: 8.5,
    lastMonthConversion: 19.8,
  },
  {
    id: 3,
    name: 'Rahul',
    avatar: 'RA',
    totalLeads: 118,
    convertedLeads: 22,
    conversionRate: 18.6,
    avgResponseTime: '15 mins',
    responseTimeValue: 15,
    totalCalls: 198,
    meetingsBooked: 35,
    revenue: 3200000,
    projects: 5,
    activeDeals: 8,
    avgDealSize: 640000,
    rank: 3,
    trend: 'down',
    trendValue: -3.2,
    lastMonthConversion: 21.2,
  },
  {
    id: 4,
    name: 'Sneha',
    avatar: 'SN',
    totalLeads: 98,
    convertedLeads: 18,
    conversionRate: 18.4,
    avgResponseTime: '10 mins',
    responseTimeValue: 10,
    totalCalls: 176,
    meetingsBooked: 28,
    revenue: 2900000,
    projects: 4,
    activeDeals: 6,
    avgDealSize: 725000,
    rank: 4,
    trend: 'up',
    trendValue: 12.8,
    lastMonthConversion: 16.1,
  },
];

export const Analytics: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<string>('month');
  const [sortBy, setSortBy] = useState<string>('revenue');

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgConversion = Math.round((conversionData[conversionData.length - 1].count / conversionData[0].count) * 100);
  const totalProjects = revenueData.reduce((sum, d) => sum + d.projects, 0);
  const teamSize = teamPerformance.length;

  // Time period options
  const timePeriodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'conversion', label: 'Conversion Rate' },
    { value: 'leads', label: 'Total Leads' },
    { value: 'responseTime', label: 'Response Time' },
  ];

  // Sort BDR data
  const sortedBDRs = [...bdrComparison].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.revenue - a.revenue;
      case 'conversion':
        return b.conversionRate - a.conversionRate;
      case 'leads':
        return b.totalLeads - a.totalLeads;
      case 'responseTime':
        return a.responseTimeValue - b.responseTimeValue;
      default:
        return 0;
    }
  });

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
                formatter={(val: number | undefined) => val ? `₹${(val / 100000).toFixed(1)}L` : ''}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              BDR Performance Comparison
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Detailed metrics for business development team
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={timePeriod}
              onChange={(value) => setTimePeriod(value)}
              options={timePeriodOptions}
              className="w-40"
            />
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value)}
              options={sortOptions}
              className="w-48"
            />
          </div>
        </div>

        {/* BDR Comparison Cards */}
        <div className="space-y-4">
          {sortedBDRs.map((bdr) => (
            <div
              key={bdr.id}
              className="group relative border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                #{bdr.rank}
              </div>

              <div className="flex items-start gap-5">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {bdr.avatar}
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-gray-900">{bdr.name}</h4>
                    <Badge
                      variant={bdr.trend === 'up' ? 'success' : 'error'}
                      className="mt-1 text-xs"
                    >
                      {bdr.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {bdr.trendValue > 0 ? '+' : ''}
                      {bdr.trendValue}%
                    </Badge>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex-1 grid grid-cols-4 gap-4">
                  {/* Revenue & Projects */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Revenue
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      ₹{(bdr.revenue / 100000).toFixed(1)}L
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bdr.projects} projects • Avg: ₹
                      {(bdr.avgDealSize / 100000).toFixed(1)}L
                    </p>
                  </div>

                  {/* Leads & Conversion */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Conversion
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {bdr.conversionRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bdr.convertedLeads}/{bdr.totalLeads} leads converted
                    </p>
                  </div>

                  {/* Response Time & Calls */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Response
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {bdr.avgResponseTime}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bdr.totalCalls} total calls made
                    </p>
                  </div>

                  {/* Meetings & Active Deals */}
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <PhoneCall className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Meetings
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {bdr.meetingsBooked}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bdr.activeDeals} active deals
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Overall Performance</span>
                  <span className="font-semibold">
                    {((bdr.conversionRate / 25) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      bdr.rank === 1
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : bdr.rank === 2
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : bdr.rank === 3
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                    style={{ width: `${(bdr.conversionRate / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Comparison to Last Month */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Last month: {bdr.lastMonthConversion}% conversion
                </span>
                <span
                  className={`font-semibold ${
                    bdr.conversionRate > bdr.lastMonthConversion
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {bdr.conversionRate > bdr.lastMonthConversion
                    ? '↗'
                    : '↘'}{' '}
                  {Math.abs(
                    bdr.conversionRate - bdr.lastMonthConversion
                  ).toFixed(1)}
                  % change
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {sortedBDRs.reduce((sum, bdr) => sum + bdr.totalLeads, 0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Total Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {sortedBDRs.reduce((sum, bdr) => sum + bdr.convertedLeads, 0)}
            </p>
            <p className="text-xs text-gray-600 mt-1">Converted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {(
                (sortedBDRs.reduce((sum, bdr) => sum + bdr.conversionRate, 0) /
                  sortedBDRs.length)
              ).toFixed(1)}
              %
            </p>
            <p className="text-xs text-gray-600 mt-1">Avg Conversion</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ₹
              {(
                sortedBDRs.reduce((sum, bdr) => sum + bdr.revenue, 0) / 10000000
              ).toFixed(2)}
              Cr
            </p>
            <p className="text-xs text-gray-600 mt-1">Total Revenue</p>
          </div>
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
