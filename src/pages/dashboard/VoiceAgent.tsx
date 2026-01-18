import React from 'react';
import { Phone, Play, FileText, User, TrendingUp, Clock } from 'lucide-react';
import { Card, Button, Badge, Toggle } from '../../components/ui';
import { StatCard } from '../../components/dashboard/StatCard';

export const VoiceAgentPage: React.FC = () => {
  const recentCalls = [
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg text-secondary">Voice Agent</h1>
          <p className="font-body text-body text-ash mt-1">
            AI-powered phone assistant analytics
          </p>
        </div>
        <Button variant="secondary">Settings</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center">
              <Phone size={24} className="text-teal" />
            </div>
            <Toggle defaultChecked />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
              <p className="font-body font-medium text-lg text-secondary">Agent Active</p>
            </div>
            <p className="font-body text-sm text-ash">24/7 Availability</p>
          </div>
        </Card>

        <StatCard
          icon={Phone}
          label="Calls This Week"
          value={247}
          change={{ value: 18, isPositive: true }}
          iconColor="primary"
        />

        <StatCard
          icon={Clock}
          label="Average Duration"
          value="12 min"
          change={{ value: 2, isPositive: false }}
          iconColor="olive"
        />
      </div>

      <Card>
        <div className="p-6 border-b border-ash/10 flex items-center justify-between">
          <h2 className="font-display text-display-sm text-secondary">Recent Calls</h2>
          <Button variant="ghost" size="sm">View All →</Button>
        </div>

        <div className="divide-y divide-ash/10">
          {recentCalls.map((call) => (
            <div key={call.id} className="p-6 hover:bg-ash/5 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-secondary">{call.phone}</p>
                    <p className="font-body text-sm text-ash">{call.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm text-ash">Duration</p>
                  <p className="font-body font-medium text-secondary">{call.duration}</p>
                </div>
              </div>

              <p className="font-body text-sm text-secondary mb-3">{call.summary}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {call.outcomes.map((outcome, i) => (
                  <Badge key={i} className="bg-teal/10 text-teal">
                    ● {outcome}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" leftIcon={<Play />}>
                  Play Recording
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<FileText />}>
                  Transcript
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<User />}>
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
