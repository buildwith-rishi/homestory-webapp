import React, { useState } from 'react';
import { Plus, Phone, Mail, MessageSquare, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { Card, Button, Badge, Progress } from '../../components/ui';

const stages = ['New', 'Qualified', 'Meeting', 'Proposal', 'Won'];

export const LeadsPage: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<number | null>(null);

  const leads = [
    {
      id: 1,
      name: 'Ramesh Iyer',
      phone: '+91 98765 43210',
      email: 'ramesh@example.com',
      propertyType: '3BHK Apartment',
      location: 'HSR Layout',
      budget: '₹25-30L',
      source: 'Instagram',
      stage: 'Meeting',
      score: 85,
      lastContact: '2 hours ago',
    },
    {
      id: 2,
      name: 'Sneha Reddy',
      phone: '+91 98123 45678',
      email: 'sneha@example.com',
      propertyType: '4BHK Villa',
      location: 'Whitefield',
      budget: '₹50-60L',
      source: 'Website',
      stage: 'Proposal',
      score: 92,
      lastContact: '1 day ago',
    },
    {
      id: 3,
      name: 'Vikram Malhotra',
      phone: '+91 97654 32109',
      email: 'vikram@example.com',
      propertyType: '2BHK Apartment',
      location: 'Koramangala',
      budget: '₹15-20L',
      source: 'Voice Bot',
      stage: 'Qualified',
      score: 68,
      lastContact: '3 hours ago',
    },
  ];

  const leadCounts = {
    New: 32,
    Qualified: 18,
    Meeting: 8,
    Proposal: 5,
    Won: 3,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg text-secondary">Leads & CRM</h1>
          <p className="font-body text-body text-ash mt-1">Manage your sales pipeline</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Export</Button>
          <Button leftIcon={<Plus />}>Add Lead</Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <Card key={stage} className="flex-shrink-0 w-40 p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="font-display text-display-md text-secondary mb-1">
              {leadCounts[stage as keyof typeof leadCounts]}
            </div>
            <div className="font-body text-sm text-ash mb-2">{stage}</div>
            {index < stages.length - 1 && (
              <div className="text-xs text-ash">→</div>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ash/5 border-b border-ash/10">
              <tr>
                <th className="px-6 py-3 text-left font-body text-sm text-ash">Lead</th>
                <th className="px-6 py-3 text-left font-body text-sm text-ash">Source</th>
                <th className="px-6 py-3 text-left font-body text-sm text-ash">Score</th>
                <th className="px-6 py-3 text-left font-body text-sm text-ash">Stage</th>
                <th className="px-6 py-3 text-left font-body text-sm text-ash">Last Contact</th>
                <th className="px-6 py-3 text-left font-body text-sm text-ash">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-ash/10 hover:bg-ash/5 cursor-pointer"
                  onClick={() => setSelectedLead(lead.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          lead.score >= 80 ? 'bg-primary' : 'bg-ash'
                        }`}
                      >
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-body font-medium text-secondary">{lead.name}</div>
                        <div className="font-body text-sm text-ash">{lead.propertyType}, {lead.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge>{lead.source}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Progress value={lead.score} className="w-20" />
                      <span className="text-sm text-ash font-medium">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={lead.stage === 'Proposal' ? 'primary' : 'secondary'}>
                      {lead.stage}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-body text-sm text-ash">{lead.lastContact}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-ash/10 rounded-lg" title="Call">
                        <Phone size={16} className="text-ash" />
                      </button>
                      <button className="p-2 hover:bg-ash/10 rounded-lg" title="WhatsApp">
                        <MessageSquare size={16} className="text-ash" />
                      </button>
                      <button className="p-2 hover:bg-ash/10 rounded-lg" title="Email">
                        <Mail size={16} className="text-ash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
