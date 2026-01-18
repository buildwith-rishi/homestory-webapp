import React from 'react';
import { Phone, Play, FileText, User, TrendingUp, TrendingDown, Clock, Settings as SettingsIcon } from 'lucide-react';
import { Card, Button, Badge, Toggle } from '../../components/ui';

interface Call {
  id: number;
  phone: string;
  duration: string;
  summary: string;
  outcomes: string[];
  timestamp: string;
}

const recentCalls: Call[] = [
  {
    id: 1,
    phone: '+91 98765 43210',
    duration: '4:32',
    summary: 'Caller inquired about 2BHK pricing in Indiranagar',
    outcomes: ['Quote provided', 'Meeting scheduled for Jan 18'],
    timestamp: '3 min ago',
  },
  {
    id: 2,
    phone: '+91 98123 45678',
    duration: '12:15',
    summary: 'Detailed discussion about 3BHK villa interiors',
    outcomes: ['Budget discussed', 'Style preferences noted'],
    timestamp: '1 hour ago',
  },
  {
    id: 3,
    phone: '+91 97654 32109',
    duration: '2:18',
    summary: 'Quick FAQ about material quality and warranty',
    outcomes: ['FAQ answered', 'Brochure sent'],
    timestamp: '2 hours ago',
  },
];

export const VoiceAgentPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Agent</h1>
          <p className="text-gray-600 mt-1">AI-powered phone assistant analytics</p>
        </div>
        <Button className="rounded-xl">
          <SettingsIcon className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent Status Card */}
        <Card className="p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <Toggle defaultChecked />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse" />
              <p className="text-lg font-semibold text-gray-900">Agent Active</p>
            </div>
            <p className="text-sm text-gray-600">24/7 Availability</p>
          </div>
        </Card>

        {/* Calls This Week Card */}
        <Card className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
              <TrendingUp className="w-3 h-3" />
              18%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Calls This Week</p>
            <p className="text-3xl font-bold text-gray-900">247</p>
          </div>
        </Card>

        {/* Average Duration Card */}
        <Card className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
              <TrendingDown className="w-3 h-3" />
              2%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Duration</p>
            <p className="text-3xl font-bold text-gray-900">12 min</p>
          </div>
        </Card>
      </div>

      {/* Recent Calls */}
      <Card className="rounded-xl overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-transparent flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Calls</h2>
          <Button variant="ghost" className="text-orange-600 hover:bg-orange-100 rounded-lg">
            View All →
          </Button>
        </div>

        <div className="divide-y divide-gray-200">
          {recentCalls.map((call) => (
            <div key={call.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{call.phone}</p>
                    <p className="text-sm text-gray-500">{call.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{call.duration}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{call.summary}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {call.outcomes.map((outcome, i) => (
                  <Badge key={i} className="bg-teal-100 text-teal-700 rounded-lg border border-teal-200">
                    ● {outcome}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" className="rounded-lg text-orange-600 hover:bg-orange-100">
                  <Play className="w-4 h-4" />
                  Play Recording
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-blue-600 hover:bg-blue-100">
                  <FileText className="w-4 h-4" />
                  Transcript
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-emerald-600 hover:bg-emerald-100">
                  <User className="w-4 h-4" />
                  View Lead
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
