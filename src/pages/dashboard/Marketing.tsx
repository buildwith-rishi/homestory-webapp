import React from 'react';
import { TrendingUp, Users, DollarSign, Target, BarChart3, PieChart } from 'lucide-react';
import { Card } from '../../components/ui';
import { AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const campaignData = [
  { month: 'Jan', roi: 145, leads: 32, spend: 45000 },
  { month: 'Feb', roi: 178, leads: 45, spend: 52000 },
  { month: 'Mar', roi: 165, leads: 38, spend: 48000 },
  { month: 'Apr', roi: 192, leads: 51, spend: 55000 },
  { month: 'May', roi: 208, leads: 58, spend: 58000 },
  { month: 'Jun', roi: 225, leads: 67, spend: 62000 },
];

const channelData = [
  { name: 'Social Media', value: 35, color: '#3b82f6' },
  { name: 'Google Ads', value: 28, color: '#f59e0b' },
  { name: 'Referrals', value: 22, color: '#10b981' },
  { name: 'Email', value: 15, color: '#8b5cf6' },
];

const campaigns = [
  { id: 1, name: 'Summer Home Campaign', status: 'active', budget: 50000, spent: 32000, leads: 45, roi: 215 },
  { id: 2, name: 'Luxury Villa Series', status: 'active', budget: 75000, spent: 48000, leads: 28, roi: 189 },
  { id: 3, name: 'Apartment Makeover', status: 'completed', budget: 40000, spent: 40000, leads: 52, roi: 245 },
];

export const Marketing: React.FC = () => {
  const totalLeads = campaignData.reduce((sum, d) => sum + d.leads, 0);
  const totalSpend = campaignData.reduce((sum, d) => sum + d.spend, 0);
  const avgROI = Math.round(campaignData.reduce((sum, d) => sum + d.roi, 0) / campaignData.length);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing & Campaigns</h1>
        <p className="text-gray-600 mt-1">Track campaign performance and ROI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{campaigns.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeads}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{(totalSpend / 100000).toFixed(1)}L</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg ROI</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgROI}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            ROI Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="roi" stroke="#DC5800" fill="url(#colorRoi)" strokeWidth={2} />
              <defs>
                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC5800" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC5800" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-orange-600" />
            Lead Sources
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </RePieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Campaigns</h3>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium mt-1 ${
                    campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{campaign.roi}%</p>
                  <p className="text-xs text-gray-600">ROI</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Budget</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">₹{(campaign.budget / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Spent</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">₹{(campaign.spent / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Leads</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{campaign.leads}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Budget Used</span>
                  <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
