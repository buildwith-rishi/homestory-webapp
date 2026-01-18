import React from 'react';
import { Plus, Phone, Mail, MapPin } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

export const EngineersPage: React.FC = () => {
  const engineers = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh@goodhomestory.com',
      specialty: 'Civil & Structural',
      activeProjects: 5,
      location: 'HSR Layout',
      status: 'available',
    },
    {
      id: 2,
      name: 'Priya Sharma',
      phone: '+91 98123 45678',
      email: 'priya@goodhomestory.com',
      specialty: 'Electrical & Plumbing',
      activeProjects: 3,
      location: 'Whitefield',
      status: 'on-site',
    },
    {
      id: 3,
      name: 'Amit Patel',
      phone: '+91 97654 32109',
      email: 'amit@goodhomestory.com',
      specialty: 'Finishing & Paint',
      activeProjects: 4,
      location: 'Koramangala',
      status: 'available',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg text-secondary">Site Engineers</h1>
          <p className="font-body text-body text-ash mt-1">Manage your field team</p>
        </div>
        <Button leftIcon={<Plus />}>Add Engineer</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engineers.map((engineer) => (
          <Card key={engineer.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="font-display text-display-sm text-primary">
                  {engineer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <Badge
                variant={engineer.status === 'available' ? 'secondary' : 'primary'}
              >
                {engineer.status === 'available' ? '🟢 Available' : '🔴 On-site'}
              </Badge>
            </div>

            <h3 className="font-body font-medium text-lg text-secondary mb-1">
              {engineer.name}
            </h3>
            <p className="font-body text-sm text-ash mb-4">{engineer.specialty}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-ash">
                <Phone size={14} />
                <span>{engineer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-ash">
                <Mail size={14} />
                <span>{engineer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-ash">
                <MapPin size={14} />
                <span>{engineer.location}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-ash/10">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-ash">Active Projects</span>
                <span className="font-body font-medium text-primary">
                  {engineer.activeProjects}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="ghost" size="sm" className="flex-1">
                View Projects
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                Contact
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
