import React from 'react';
import { Send, MessageSquare, Mail, CheckCheck } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

export const UpdatesPage: React.FC = () => {
  const updates = [
    {
      id: 1,
      client: 'Sharma Family',
      project: 'Modern 3BHK',
      type: 'Stage Update',
      message: 'Design phase started. Your 3D renders will be ready...',
      channels: ['WhatsApp', 'Email'],
      status: 'delivered',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      client: 'Kumar Residence',
      project: 'Luxury Villa',
      type: 'Payment Reminder',
      message: 'Gentle reminder: 40% milestone payment...',
      channels: ['WhatsApp'],
      status: 'read',
      timestamp: '1 day ago',
    },
    {
      id: 3,
      client: 'Patel Home',
      project: 'Contemporary 2BHK',
      type: 'Photo Update',
      message: 'Here are the latest photos from your site...',
      channels: ['WhatsApp', 'Email'],
      status: 'scheduled',
      timestamp: 'Tomorrow, 6:00 PM',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg text-secondary">Customer Updates</h1>
          <p className="font-body text-body text-ash mt-1">
            Communication log and automated messages
          </p>
        </div>
        <Button leftIcon={<Send />}>Send Update</Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-ash/10">
            <h3 className="font-body font-medium text-secondary">Customers</h3>
          </div>
          <div className="p-2 space-y-1">
            {['Sharma Family', 'Kumar Residence', 'Patel Home', 'Gupta Apartment'].map((client) => (
              <button
                key={client}
                className="w-full p-3 text-left rounded-lg hover:bg-ash/5 transition-colors"
              >
                <div className="font-body text-sm text-secondary">{client}</div>
                <div className="font-body text-xs text-ash mt-1">2 hours ago</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="p-6 border-b border-ash/10">
            <h3 className="font-display text-display-sm text-secondary">Sharma Family - Modern 3BHK</h3>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm">Send Update</Button>
              <Button variant="ghost" size="sm">Call</Button>
              <Button variant="ghost" size="sm">WhatsApp</Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {updates.map((update, i) => (
              <div key={update.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      update.status === 'delivered'
                        ? 'bg-primary'
                        : update.status === 'read'
                        ? 'bg-teal'
                        : 'bg-ash/30'
                    }`}
                  />
                  {i < updates.length - 1 && (
                    <div className="w-0.5 h-16 bg-ash/20 my-2" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-body font-medium text-secondary">{update.type}</h4>
                        {update.status === 'read' && (
                          <CheckCheck size={16} className="text-teal" />
                        )}
                      </div>
                      <p className="font-body text-sm text-ash mt-1">{update.timestamp}</p>
                    </div>
                    <Badge
                      variant={
                        update.status === 'read'
                          ? 'secondary'
                          : update.status === 'delivered'
                          ? 'primary'
                          : 'default'
                      }
                    >
                      {update.status}
                    </Badge>
                  </div>

                  <Card className="p-4 bg-ash/5">
                    <p className="font-body text-sm text-secondary">{update.message}</p>
                    <div className="flex gap-2 mt-3">
                      {update.channels.map((channel) => (
                        <Badge key={channel} className="bg-white">
                          {channel === 'WhatsApp' ? <MessageSquare size={12} /> : <Mail size={12} />}
                          <span className="ml-1">{channel}</span>
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
