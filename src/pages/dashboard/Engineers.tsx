import React, { useState } from 'react';
import { Users, Calendar, CheckCircle2, Clock, Search, Plus, Phone, Mail, MapPin, Wrench, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

interface Engineer {
  id: number;
  name: string;
  role: string;
  initials: string;
  phone: string;
  email: string;
  status: 'available' | 'on_site' | 'busy';
  skills: string[];
  currentProjects: number;
  completedTasks: number;
  rating: number;
  location?: string;
}

const mockEngineers: Engineer[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    role: 'Lead Carpenter',
    initials: 'RK',
    phone: '+91 98765 11111',
    email: 'rajesh@goodhomestory.com',
    status: 'on_site',
    skills: ['Carpentry', 'Woodwork', 'Furniture'],
    currentProjects: 2,
    completedTasks: 145,
    rating: 4.8,
    location: 'HSR Layout Villa',
  },
  {
    id: 2,
    name: 'Amit Sharma',
    role: 'Electrician',
    initials: 'AS',
    phone: '+91 98765 22222',
    email: 'amit@goodhomestory.com',
    status: 'available',
    skills: ['Electrical', 'Lighting', 'Wiring'],
    currentProjects: 1,
    completedTasks: 98,
    rating: 4.6,
  },
  {
    id: 3,
    name: 'Pradeep Reddy',
    role: 'Plumber',
    initials: 'PR',
    phone: '+91 98765 33333',
    email: 'pradeep@goodhomestory.com',
    status: 'busy',
    skills: ['Plumbing', 'Sanitary', 'Fixtures'],
    currentProjects: 3,
    completedTasks: 76,
    rating: 4.5,
  },
  {
    id: 4,
    name: 'Vikram Singh',
    role: 'Painter',
    initials: 'VS',
    phone: '+91 98765 44444',
    email: 'vikram@goodhomestory.com',
    status: 'on_site',
    skills: ['Painting', 'Texture', 'Finishing'],
    currentProjects: 1,
    completedTasks: 112,
    rating: 4.7,
    location: 'Whitefield Apartment',
  },
];

const statusColors = {
  available: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  on_site: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  busy: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const EngineersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredEngineers = mockEngineers.filter(engineer => {
    const matchesSearch = engineer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         engineer.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || engineer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalEngineers = mockEngineers.length;
  const availableCount = mockEngineers.filter(e => e.status === 'available').length;
  const onSiteCount = mockEngineers.filter(e => e.status === 'on_site').length;
  const totalTasks = mockEngineers.reduce((sum, e) => sum + e.completedTasks, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Engineers & Team</h1>
          <p className="text-gray-600 mt-1">Manage your field team and assignments</p>
        </div>
        <Button className="rounded-xl">
          <Plus className="w-4 h-4" />
          Add Engineer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Engineers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalEngineers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{availableCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Site</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{onSiteCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalTasks}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search engineers..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'available', 'on_site', 'busy'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Engineers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEngineers.map((engineer) => {
          const statusColor = statusColors[engineer.status];
          
          return (
            <Card key={engineer.id} className="p-5 rounded-xl hover:shadow-lg transition-all group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold">
                    {engineer.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {engineer.name}
                    </h3>
                    <p className="text-sm text-gray-600">{engineer.role}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusColor.bg} ${statusColor.text} mb-4`}>
                <div className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                <span className="text-xs font-medium">{engineer.status.replace('_', ' ')}</span>
              </div>

              {/* Location */}
              {engineer.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{engineer.location}</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600">Active Projects</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{engineer.currentProjects}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{engineer.completedTasks}</p>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {engineer.skills.map((skill) => (
                  <Badge key={skill} className="text-xs bg-blue-50 text-blue-700 rounded-lg">
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= Math.floor(engineer.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{engineer.rating}</span>
              </div>

              {/* Contact */}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 rounded-xl text-sm">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button variant="secondary" className="flex-1 rounded-xl text-sm">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEngineers.length === 0 && (
        <Card className="p-12 rounded-xl text-center">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No engineers found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters</p>
        </Card>
      )}
    </div>
  );
};
