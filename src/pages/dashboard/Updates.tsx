import React, { useState } from 'react';
import { Send, MessageSquare, Mail, CheckCheck, Phone, Clock, Filter, Search } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

interface Update {
  id: number;
  client: string;
  project: string;
  type: string;
  message: string;
  channels: Array<'WhatsApp' | 'Email'>;
  status: 'delivered' | 'read' | 'scheduled';
  timestamp: string;
}

const mockUpdates: Update[] = [
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
  {
    id: 4,
    client: 'Gupta Apartment',
    project: 'Minimalist Studio',
    type: 'Material Selection',
    message: 'Please review and approve the material samples...',
    channels: ['Email'],
    status: 'delivered',
    timestamp: '3 hours ago',
  },
];

const customers = [
  { name: 'Sharma Family', lastUpdate: '2 hours ago' },
  { name: 'Kumar Residence', lastUpdate: '2 hours ago' },
  { name: 'Patel Home', lastUpdate: '2 hours ago' },
  { name: 'Gupta Apartment', lastUpdate: '3 hours ago' },
];

export const UpdatesPage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState('Sharma Family');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUpdates = mockUpdates.filter(u => 
    u.client === selectedCustomer &&
    (u.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedProject = mockUpdates.find(u => u.client === selectedCustomer)?.project || '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
      case 'read':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'scheduled':
        return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Updates</h1>
          <p className="text-gray-600 mt-1">Communication log and automated messages</p>
        </div>
        <Button className="rounded-xl">
          <Send className="w-4 h-4" />
          Send Update
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Customers Sidebar */}
        <Card className="lg:col-span-1 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Customers</h3>
          </div>
          <div className="p-2">
            {customers.map((customer) => (
              <button
                key={customer.name}
                onClick={() => setSelectedCustomer(customer.name)}
                className={`w-full p-3 text-left rounded-lg transition-all ${
                  selectedCustomer === customer.name
                    ? 'bg-orange-50 border-2 border-orange-200'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className={`text-sm font-medium ${
                  selectedCustomer === customer.name ? 'text-orange-900' : 'text-gray-900'
                }`}>
                  {customer.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">{customer.lastUpdate}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Updates Content */}
        <Card className="lg:col-span-3 rounded-xl overflow-hidden">
          {/* Selected Customer Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-transparent">
            <h3 className="text-xl font-bold text-gray-900">
              {selectedCustomer} - {selectedProject}
            </h3>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" size="sm" className="rounded-lg text-orange-600 hover:bg-orange-100">
                <Send className="w-4 h-4" />
                Send Update
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-blue-600 hover:bg-blue-100">
                <Phone className="w-4 h-4" />
                Call
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-emerald-600 hover:bg-emerald-100">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search updates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Updates Timeline */}
          <div className="p-6">
            <div className="space-y-6">
              {filteredUpdates.map((update, i) => {
                const statusColor = getStatusColor(update.status);
                return (
                  <div key={update.id} className="flex gap-4">
                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${statusColor.dot} flex-shrink-0 ring-4 ring-white shadow`} />
                      {i < filteredUpdates.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>

                    {/* Update Card */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{update.type}</h4>
                            {update.status === 'read' && (
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-sm text-gray-500">{update.timestamp}</p>
                          </div>
                        </div>
                        <Badge className={`rounded-lg ${statusColor.bg} ${statusColor.text}`}>
                          {update.status}
                        </Badge>
                      </div>

                      {/* Message Content */}
                      <Card className="p-4 rounded-xl bg-gray-50 border-l-4 border-orange-500">
                        <p className="text-sm text-gray-700">{update.message}</p>
                        <div className="flex gap-2 mt-3">
                          {update.channels.map((channel) => (
                            <Badge key={channel} className="bg-white text-gray-700 rounded-lg border border-gray-200">
                              {channel === 'WhatsApp' ? (
                                <MessageSquare className="w-3 h-3 mr-1" />
                              ) : (
                                <Mail className="w-3 h-3 mr-1" />
                              )}
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredUpdates.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No updates found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Send your first update to this customer'}
                </p>
                <Button className="rounded-xl">
                  <Send className="w-4 h-4" />
                  Send Update
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
