import React, { useState } from 'react';
import { Calendar, Mic, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, Button, Badge, Tabs } from '../../components/ui';

export const MeetingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  const meetings = [
    {
      id: 1,
      title: 'Sharma Family - Initial Consultation',
      client: 'Rajesh Sharma',
      date: '2026-01-20',
      time: '10:00 AM',
      duration: '45 mins',
      status: 'scheduled',
      transcribed: false,
    },
    {
      id: 2,
      title: 'Kumar Residence - Design Review',
      client: 'Priya Kumar',
      date: '2026-01-18',
      time: '2:30 PM',
      duration: '1 hr 15 mins',
      status: 'completed',
      transcribed: true,
      tasksCount: 8,
    },
    {
      id: 3,
      title: 'Patel Home - Site Discussion',
      client: 'Amit Patel',
      date: '2026-01-18',
      time: '4:00 PM',
      duration: '30 mins',
      status: 'in_progress',
      transcribed: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg text-secondary">Meetings & Transcription</h1>
          <p className="font-body text-body text-ash mt-1">Manage and review all client meetings</p>
        </div>
        <Button leftIcon={<Calendar />}>Schedule Meeting</Button>
      </div>

      <div className="flex gap-2">
        {['all', 'scheduled', 'completed', 'transcribed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-body text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-white text-ash hover:bg-ash/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <Card
            key={meeting.id}
            className={`p-6 hover:shadow-md transition-all cursor-pointer ${
              meeting.status === 'in_progress' ? 'border-l-4 border-l-primary' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {meeting.status === 'in_progress' && (
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  )}
                  {meeting.status === 'scheduled' && (
                    <div className="w-3 h-3 border-2 border-ash rounded-full" />
                  )}
                  {meeting.status === 'completed' && (
                    <CheckCircle size={16} className="text-teal" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-body font-medium text-lg text-secondary mb-1">
                    {meeting.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-ash">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {meeting.client}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {meeting.time}
                    </span>
                    {meeting.duration && (
                      <span>Duration: {meeting.duration}</span>
                    )}
                  </div>
                  {meeting.transcribed && meeting.tasksCount && (
                    <div className="mt-2 flex gap-2">
                      <Badge className="bg-teal/10 text-teal">Transcribed</Badge>
                      <Badge className="bg-primary/10 text-primary">
                        {meeting.tasksCount} Tasks Generated
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    meeting.status === 'in_progress'
                      ? 'primary'
                      : meeting.status === 'completed'
                      ? 'secondary'
                      : 'default'
                  }
                >
                  {meeting.status === 'in_progress' ? 'Live' : meeting.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  View →
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
