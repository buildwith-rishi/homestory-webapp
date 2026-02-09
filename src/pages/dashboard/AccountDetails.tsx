import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Activity,
  Loader2,
  Copy,
  AlertCircle,
  FileText,
  X,
  Check,
  User,
  Clock,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { Button, Badge, Card } from '../../components/ui';
import AccountAPI, { Account } from '../../services/accountApi';
import LeadAPI, { Lead } from '../../services/leadApi';
import toast from 'react-hot-toast';
import { getAccountTypeLabel } from '../../utils/accountHelpers';
import { getSourceLabel } from '../../utils/leadHelpers';

// Edit Account Modal
const EditAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onSave: (updates: Partial<Account>) => Promise<void>;
}> = ({ isOpen, onClose, account, onSave }) => {
  const [formData, setFormData] = useState<Partial<Account>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        type: account.type || '',
        industry: account.industry || '',
        phone: account.phone || '',
        email: account.email || '',
        website: account.website || '',
        address: account.address || '',
        city: account.city || '',
        state: account.state || '',
        country: account.country || '',
        postalCode: account.postalCode || '',
        revenue: account.revenue || '',
        employees: account.employees,
        description: account.description || '',
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast.success('Account updated successfully!');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update account';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Account</h2>
              <p className="text-sm text-gray-600">Update account information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Notes</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [relatedLead, setRelatedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id]);

  const fetchAccountDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const accountData = await AccountAPI.getAccountById(id);
      setAccount(accountData);

      // Fetch related lead if account was converted from lead
      if (accountData.leadId) {
        try {
          const leadData = await LeadAPI.getLeadById(accountData.leadId);
          setRelatedLead(leadData);
        } catch (leadError) {
          console.error('Error fetching related lead:', leadError);
          // Lead might have been deleted, that's okay
        }
      }
    } catch (error) {
      console.error('Error fetching account:', error);
      toast.error('Failed to load account details');
      navigate('/dashboard/accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (updates: Partial<Account>) => {
    if (!id) return;

    try {
      const updatedAccount = await AccountAPI.updateAccount(id, updates);
      setAccount(updatedAccount);
      setShowEditModal(false);
      toast.success('Account updated successfully!');
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;

    try {
      await AccountAPI.deleteAccount(id);
      toast.success('Account deleted successfully');
      navigate('/dashboard/accounts');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <p className="text-gray-600 font-medium">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Not Found</h2>
        <p className="text-gray-600 mb-6">The account you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/dashboard/accounts')} className="bg-orange-500 hover:bg-orange-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/accounts')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {account.type && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      {getAccountTypeLabel(account.type)}
                    </Badge>
                  )}
                  {account.industry && (
                    <span className="text-sm text-gray-600">• {account.industry}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowEditModal(true)}
                variant="secondary"
                className="rounded-xl"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="secondary"
                className="rounded-xl text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-500" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {account.phone && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900">{account.phone}</p>
                      <button
                        onClick={() => copyToClipboard(account.phone!, 'Phone number')}
                        className="text-xs text-orange-600 hover:text-orange-700 mt-1 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                )}

                {account.email && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Email Address</p>
                      <p className="text-sm font-medium text-gray-900 break-all">{account.email}</p>
                      <button
                        onClick={() => copyToClipboard(account.email!, 'Email')}
                        className="text-xs text-orange-600 hover:text-orange-700 mt-1 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                )}

                {account.website && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Website</p>
                      <a
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        {account.website} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Location Information */}
            {(account.address || account.city || account.state) && (
              <Card className="p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Location
                </h3>
                <div className="space-y-2">
                  {account.address && (
                    <p className="text-gray-700">{account.address}</p>
                  )}
                  {(account.city || account.state || account.postalCode) && (
                    <p className="text-gray-600">
                      {[account.city, account.state, account.postalCode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {account.country && (
                    <p className="text-gray-600">{account.country}</p>
                  )}
                </div>
              </Card>
            )}

            {/* Business Details */}
            {(account.revenue || account.employees) && (
              <Card className="p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Business Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {account.revenue && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Revenue</p>
                        <p className="text-sm font-medium text-gray-900">{account.revenue}</p>
                      </div>
                    </div>
                  )}

                  {account.employees && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Employees</p>
                        <p className="text-sm font-medium text-gray-900">{account.employees}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Description / Notes */}
            {account.description && (
              <Card className="p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  Description / Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{account.description}</p>
              </Card>
            )}

            {/* Related Lead Information */}
            {relatedLead && (
              <Card className="p-6 rounded-xl border-2 border-blue-200 bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Converted from Lead
                </h3>
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{relatedLead.name}</p>
                      {relatedLead.source && (
                        <p className="text-sm text-gray-600">
                          Source: {getSourceLabel(relatedLead.source)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/leads/${relatedLead.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      View Lead <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {relatedLead.email && (
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-gray-900">{relatedLead.email}</p>
                      </div>
                    )}
                    {relatedLead.phone && (
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="text-gray-900">{relatedLead.phone}</p>
                      </div>
                    )}
                  </div>
                  {relatedLead.createdAt && (
                    <p className="text-xs text-gray-500 pt-2 border-t">
                      Lead created on {new Date(relatedLead.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Metadata & Activity */}
          <div className="space-y-6">
            {/* Account Metadata */}
            <Card className="p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Account Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {account.updatedAt && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(account.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account ID</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{account.id}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {account.phone && (
                  <a
                    href={`tel:${account.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">Call {account.name}</span>
                  </a>
                )}
                {account.email && (
                  <a
                    href={`mailto:${account.email}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Mail className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">Send Email</span>
                  </a>
                )}
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">Edit Account</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditAccountModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        account={account}
        onSave={handleUpdateAccount}
      />
    </div>
  );
};

export default AccountDetails;
