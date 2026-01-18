import React, { useState } from 'react';
import { User, Building2, Bell, Zap, CreditCard, Shield, Save, Camera, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Card, Button, Input, Toggle } from '../../components/ui';

type SettingsTab = 'profile' | 'company' | 'notifications' | 'integrations' | 'billing' | 'security';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'company' as SettingsTab, label: 'Company', icon: Building2 },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'integrations' as SettingsTab, label: 'Integrations', icon: Zap },
    { id: 'billing' as SettingsTab, label: 'Billing', icon: CreditCard },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <>
              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                        AR
                      </div>
                      <button className="absolute bottom-0 right-0 w-7 h-7 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Camera className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Profile Photo</h3>
                      <p className="text-sm text-gray-600">JPG, PNG. Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <Input defaultValue="Arjun" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <Input defaultValue="Reddy" className="rounded-xl" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input type="email" defaultValue="arjun@goodhomestory.com" className="rounded-xl" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <Input type="tel" defaultValue="+91 98765 43210" className="rounded-xl" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      rows={3}
                      defaultValue="Interior designer with 10+ years of experience in residential and commercial projects."
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <Input defaultValue="HSR Layout, Bangalore" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <Input defaultValue="www.goodhomestory.com" className="rounded-xl" />
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Company Settings */}
          {activeTab === 'company' && (
            <>
              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <Input defaultValue="Good Homestory" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <Input defaultValue="Interior Design" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option>10-50 employees</option>
                        <option>1-10 employees</option>
                        <option>50-200 employees</option>
                        <option>200+ employees</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      rows={2}
                      defaultValue="123, HSR Layout, Sector 2, Bangalore - 560102"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                      <Input defaultValue="29XXXXX1234X1ZX" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                      <Input defaultValue="XXXXX1234X" className="rounded-xl" />
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="p-6 rounded-xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Receive email updates about your projects</p>
                  </div>
                  <Toggle defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">New Lead Alerts</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Get notified when a new lead is created</p>
                  </div>
                  <Toggle defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">Project Updates</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Updates on project status changes</p>
                  </div>
                  <Toggle defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">Meeting Reminders</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Reminders 30 minutes before meetings</p>
                  </div>
                  <Toggle defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing Updates</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Weekly digest of marketing performance</p>
                  </div>
                  <Toggle />
                </div>
              </div>
            </Card>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              {[
                { name: 'WhatsApp Business', desc: 'Send messages and updates', connected: true, icon: '💬' },
                { name: 'Google Calendar', desc: 'Sync meetings and events', connected: true, icon: '📅' },
                { name: 'Razorpay', desc: 'Accept payments online', connected: false, icon: '💳' },
                { name: 'Zapier', desc: 'Connect with 3000+ apps', connected: false, icon: '⚡' },
              ].map((integration) => (
                <Card key={integration.name} className="p-5 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.desc}</p>
                      </div>
                    </div>
                    <Button
                      variant={integration.connected ? 'secondary' : 'primary'}
                      className="rounded-xl"
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <>
              <Card className="p-6 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-orange-100 text-sm">Current Plan</p>
                    <h2 className="text-2xl font-bold mt-1">Professional</h2>
                  </div>
                  <Button variant="secondary" className="rounded-xl bg-white text-orange-600 hover:bg-orange-50">
                    Upgrade Plan
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-orange-100 text-sm">Price</p>
                    <p className="text-xl font-bold mt-1">₹4,999/mo</p>
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm">Next Billing</p>
                    <p className="text-xl font-bold mt-1">Feb 18</p>
                  </div>
                  <div>
                    <p className="text-orange-100 text-sm">Users</p>
                    <p className="text-xl font-bold mt-1">8 / 15</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-600">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="rounded-xl">Update</Button>
                </div>
              </Card>
            </>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <>
              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <Input type="password" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <Input type="password" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <Input type="password" className="rounded-xl" />
                  </div>
                  <Button className="rounded-xl">Update Password</Button>
                </div>
              </Card>

              <Card className="p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h2>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Enable 2FA</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Add an extra layer of security</p>
                  </div>
                  <Toggle />
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                Export Account Data
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                View Activity Log
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                Download Invoice
              </button>
            </div>
          </Card>

          <Card className="p-5 rounded-xl border-red-200 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-3">Permanent actions cannot be undone</p>
            <button className="w-full px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
              Delete Account
            </button>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" className="rounded-xl">Cancel</Button>
        <Button className="rounded-xl">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};
