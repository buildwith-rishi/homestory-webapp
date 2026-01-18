import React from 'react';
import { Save } from 'lucide-react';
import { Card, Button, Input, Toggle } from '../../components/ui';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-display-lg text-secondary">Settings</h1>
        <p className="font-body text-body text-ash mt-1">Manage your dashboard preferences</p>
      </div>

      <Card>
        <div className="p-6 border-b border-ash/10">
          <h2 className="font-display text-display-sm text-secondary">Company Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block font-body text-sm text-ash mb-2">Company Name</label>
            <Input defaultValue="Good Homestory" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ash mb-2">Phone</label>
              <Input defaultValue="+91 1234567890" />
            </div>
            <div>
              <label className="block font-body text-sm text-ash mb-2">Email</label>
              <Input defaultValue="hello@goodhomestory.com" />
            </div>
          </div>
          <div>
            <label className="block font-body text-sm text-ash mb-2">Address</label>
            <Input defaultValue="123 Main Street, Bangalore, Karnataka 560001" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b border-ash/10">
          <h2 className="font-display text-display-sm text-secondary">Pricing Configuration</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-body text-sm text-ash mb-2">Premium (per sq.ft.)</label>
              <Input type="number" defaultValue="2500" />
            </div>
            <div>
              <label className="block font-body text-sm text-ash mb-2">Standard (per sq.ft.)</label>
              <Input type="number" defaultValue="1800" />
            </div>
            <div>
              <label className="block font-body text-sm text-ash mb-2">Basic (per sq.ft.)</label>
              <Input type="number" defaultValue="1200" />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b border-ash/10">
          <h2 className="font-display text-display-sm text-secondary">Automation Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-ash/10 rounded-lg">
            <div>
              <p className="font-body font-medium text-secondary">Stage Completion Notifications</p>
              <p className="font-body text-sm text-ash">Auto-send updates when stages complete</p>
            </div>
            <Toggle defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 border border-ash/10 rounded-lg">
            <div>
              <p className="font-body font-medium text-secondary">Weekly Progress Photos</p>
              <p className="font-body text-sm text-ash">Send photos every Friday at 6 PM</p>
            </div>
            <Toggle defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 border border-ash/10 rounded-lg">
            <div>
              <p className="font-body font-medium text-secondary">Payment Reminders</p>
              <p className="font-body text-sm text-ash">Remind 3 days before due date</p>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b border-ash/10">
          <h2 className="font-display text-display-sm text-secondary">Voice Agent</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block font-body text-sm text-ash mb-2">Voice Style</label>
            <select className="w-full h-10 px-3 bg-white border border-ash/20 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option>Professional</option>
              <option>Friendly</option>
              <option>Formal</option>
            </select>
          </div>

          <div>
            <label className="block font-body text-sm text-ash mb-3">Languages</label>
            <div className="flex flex-wrap gap-3">
              {['English', 'Hindi', 'Kannada', 'Tamil'].map((lang) => (
                <label key={lang} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="font-body text-sm text-secondary">{lang}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary">Cancel</Button>
        <Button leftIcon={<Save />}>Save Changes</Button>
      </div>
    </div>
  );
};
