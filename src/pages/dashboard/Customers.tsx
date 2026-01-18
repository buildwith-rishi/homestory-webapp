import React, { useState } from 'react';
import { Users, TrendingUp, DollarSign, Star, Search, Plus, Phone, Mail, Building2, MapPin, Calendar } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

interface Customer {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  projects: number;
  totalValue: number;
  status: 'active' | 'completed' | 'inactive';
  rating: number;
  lastContact: string;
}

const mockCustomers: Customer[] = [
  { id: 1, name: 'Rajesh Sharma', initials: 'RS', email: 'rajesh@email.com', phone: '+91 98765 43210', location: 'HSR Layout', projects: 2, totalValue: 3800000, status: 'active', rating: 5, lastContact: '2 days ago' },
  { id: 2, name: 'Priya Kumar', initials: 'PK', email: 'priya@email.com', phone: '+91 98765 43211', location: 'Whitefield', projects: 1, totalValue: 4200000, status: 'active', rating: 4.8, lastContact: '1 week ago' },
  { id: 3, name: 'Amit Patel', initials: 'AP', email: 'amit@email.com', phone: '+91 98765 43212', location: 'Indiranagar', projects: 3, totalValue: 6500000, status: 'completed', rating: 4.9, lastContact: '3 days ago' },
  { id: 4, name: 'Sneha Reddy', initials: 'SR', email: 'sneha@email.com', phone: '+91 98765 43213', location: 'Koramangala', projects: 1, totalValue: 2900000, status: 'active', rating: 4.7, lastContact: '5 days ago' },
];

const statusColors = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export const Customers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
  const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalValue, 0);
  const avgRating = mockCustomers.reduce((sum, c) => sum + c.rating, 0) / mockCustomers.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships</p>
        </div>
        <Button className="rounded-xl">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeCustomers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{(totalRevenue / 10000000).toFixed(1)}Cr</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgRating.toFixed(1)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const statusColor = statusColors[customer.status];
          return (
            <Card key={customer.id} className="p-5 rounded-xl hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                    {customer.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.location}</p>
                  </div>
                </div>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusColor.bg} ${statusColor.text} mb-4`}>
                <div className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                <span className="text-xs font-medium">{customer.status}</span>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Projects</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{customer.projects}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Value</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">₹{(customer.totalValue / 100000).toFixed(1)}L</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm ${star <= Math.floor(customer.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                  <span className="text-sm text-gray-600 ml-1">{customer.rating}</span>
                </div>
                <span className="text-xs text-gray-500">{customer.lastContact}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
