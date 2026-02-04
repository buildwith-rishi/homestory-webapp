import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Home,
  Palette,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Building2,
  Activity,
  Star,
  Send,
  Plus,
  Loader2,
  Copy,
  Sparkles,
  IndianRupee,
  Ruler,
  Target,
  MoreHorizontal,
  Share2,
  Bookmark,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui';
import LeadAPI, { Lead as APILead, LeadActivity as APILeadActivity } from '../../services/leadApi';
import AccountAPI from '../../services/accountApi';
import toast from 'react-hot-toast';
import { getSourceLabel } from '../../utils/leadHelpers';

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<APILead | null>(null);
  const [activities, setActivities] = useState<APILeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  
  // Convert to Account state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Helper function to safely display field values and prevent "undefined" text
  const safeDisplay = (value: string | undefined | null, fallback: string = "Not provided"): string => {
    if (!value || value === "undefined" || value === "null") {
      return fallback;
    }
    return value;
  };

  useEffect(() => {
    console.log('LeadDetails useEffect - ID:', id);
    
    // Reset state when ID changes to prevent showing stale data
    setLead(null);
    setActivities([]);
    setLoading(true);
    
    if (id) {
      fetchLeadDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleConvertToAccount = async () => {
    console.log('handleConvertToAccount called');
    console.log('Lead object:', lead);
    console.log('Lead ID from state:', lead?.id);
    console.log('Lead ID from URL:', id);
    
    // Use lead ID from state, fallback to URL param
    const leadId = lead?.id || id;
    
    if (!leadId) {
      console.log('No lead ID found, returning early');
      toast.error('No lead ID found');
      return;
    }

    const accountName = lead?.name || 'Unknown Account';
    console.log('Account name:', accountName);

    setIsConverting(true);
    try {
      console.log('Making API call to convert lead...');
      console.log('Request payload:', { 
        leadId: leadId, 
        name: accountName
      });
      
      const result = await AccountAPI.convertLeadToAccount(
        leadId,
        accountName
      );

      console.log('Conversion successful:', result);
      setShowConvertModal(false);
      toast.success(`Lead "${accountName}" converted to account successfully!`);

      // Navigate to accounts page to see the new account
      setTimeout(() => {
        navigate('/dashboard/accounts');
      }, 1500);
    } catch (error) {
      console.error('Conversion error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to convert lead to account';
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const fetchLeadDetails = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    console.log('Fetching lead details for ID:', id);
    setLoading(true);
    setLead(null); // Clear previous lead data
    setActivities([]); // Clear previous activities
    
    try {
      // Fetch the specific lead by ID
      const leadData = await LeadAPI.getLeadById(id);
      console.log('Lead data received for ID', id, ':', leadData);

      // Debug log to identify if API returns undefined values or string "undefined"
      console.log('Lead contact details debug:', {
        id: leadData.id,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        nameType: typeof leadData.name,
        emailType: typeof leadData.email,
        phoneType: typeof leadData.phone,
        nameIsUndefinedString: leadData.name === "undefined",
        emailIsUndefinedString: leadData.email === "undefined",
        phoneIsUndefinedString: leadData.phone === "undefined"
      });

      // Ensure we have the ID in the lead data
      if (leadData && (!leadData.id || leadData.id !== id)) {
        console.warn('Lead data ID mismatch. Expected:', id, 'Received:', leadData.id);
        leadData.id = id; // Ensure ID is set
      }
      
      setLead(leadData);
      
      // Fetch activities for this specific lead
      try {
        const activitiesData = await LeadAPI.getLeadActivities(id);
        console.log('Activities received for ID', id, ':', activitiesData?.length || 0);
        setActivities(activitiesData || []);
      } catch (activityError) {
        console.error('Error fetching activities for lead', id, ':', activityError);
        // Don't prevent showing lead details if activities fail
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching lead details for ID', id, ':', error);
      toast.error('Failed to load lead details');
      navigate('/dashboard/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    // Use lead ID from state, fallback to URL param
    const leadId = lead?.id || id;
    
    if (!leadId) {
      toast.error('No lead ID found');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${lead?.name || 'this lead'}"?`)) return;

    try {
      console.log('Deleting lead with ID:', leadId);
      await LeadAPI.deleteLead(leadId);
      toast.success('Lead deleted successfully');
      navigate('/dashboard/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete lead';
      toast.error(errorMessage);
    }
  };

  const handleAddNote = async () => {
    // Use lead ID from state, fallback to URL param
    const leadId = lead?.id || id;
    
    if (!leadId) {
      toast.error('No lead ID found');
      return;
    }
    
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setAddingNote(true);
    try {
      console.log('Adding note to lead with ID:', leadId);
      // Update the lead with the new note
      await LeadAPI.updateLead(leadId, {
        notes: lead?.notes 
          ? `${lead.notes}\n\n[${new Date().toLocaleString()}]\n${newNote.trim()}`
          : `[${new Date().toLocaleString()}]\n${newNote.trim()}`
      });
      
      toast.success('Note added successfully');
      setNewNote('');
      await fetchLeadDetails(); // Refresh lead data
    } catch (error) {
      console.error('Error adding note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add note';
      toast.error(errorMessage);
    } finally {
      setAddingNote(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'from-emerald-500 to-green-500';
    if (score >= 40) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <p className="text-gray-600 font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
        <p className="text-gray-600 mb-6">The lead you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/dashboard/leads')} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  const score = lead.score || 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <button
              onClick={() => navigate('/dashboard/leads')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Leads</span>
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bookmark className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Lead Header */}
          <div className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-orange-200/50">
                    {(lead.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                {/* Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{safeDisplay(lead.name, "Unknown Lead")}</h1>
                    {lead.priority === 'high' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                        <Sparkles className="w-3 h-3" />
                        Hot Lead
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {lead.phone && lead.phone !== "undefined" && lead.phone !== "null" && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && lead.email !== "undefined" && lead.email !== "null" && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {lead.source && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-blue-700">{getSourceLabel(lead.source)}</span>
                      </div>
                    )}
                  </div>
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      lead.status === 'Qualified' ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' :
                      lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20' :
                      lead.status === 'Proposal' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/20' :
                      lead.status === 'Won' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20' :
                      'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20'
                    }`}>
                      {lead.status || lead.stage || "New"}
                    </span>
                    {score > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-700">{score}% Score</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/dashboard/leads/${id}/edit`)}
                  className="rounded-xl"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDeleteLead}
                  className="rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Convert to Account button clicked!');
                    console.log('Current lead state:', lead);
                    console.log('Lead ID from state:', lead?.id);
                    setShowConvertModal(true);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50"
                >
                  <Building2 className="w-4 h-4" />
                  Convert to Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lead Score Card */}
            {score > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getScoreBg(score)} flex items-center justify-center`}>
                        <Target className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Lead Score</h3>
                        <p className="text-xs text-gray-500">Engagement & profile</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(score)} transition-all duration-700`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  {/* Milestones */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center py-2 px-1 bg-emerald-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] font-medium text-gray-600">Qualified</p>
                    </div>
                    <div className={`text-center py-2 px-1 rounded-lg ${lead.meetingScheduled ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <Calendar className={`w-4 h-4 mx-auto mb-1 ${lead.meetingScheduled ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className="text-[10px] font-medium text-gray-600">Meeting</p>
                    </div>
                    <div className={`text-center py-2 px-1 rounded-lg ${lead.siteVisitDone ? 'bg-purple-50' : 'bg-gray-50'}`}>
                      <Home className={`w-4 h-4 mx-auto mb-1 ${lead.siteVisitDone ? 'text-purple-600' : 'text-gray-400'}`} />
                      <p className="text-[10px] font-medium text-gray-600">Site Visit</p>
                    </div>
                    <div className={`text-center py-2 px-1 rounded-lg ${lead.quotationSent ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      <FileText className={`w-4 h-4 mx-auto mb-1 ${lead.quotationSent ? 'text-orange-600' : 'text-gray-400'}`} />
                      <p className="text-[10px] font-medium text-gray-600">Quotation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Contact Information</h3>
              </div>
              <div className="p-4">
                {(!lead.phone && !lead.email && !lead.location && !lead.city && !lead.source) ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-3">No contact information available</p>
                    <button
                      onClick={() => navigate(`/dashboard/leads/${id}/edit`)}
                      className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Add Contact Details →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lead.phone && lead.phone !== "undefined" && lead.phone !== "null" && (
                      <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                          <p className="text-sm font-semibold text-gray-900">{lead.phone}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(lead.phone!, 'Phone')}
                          className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}

                    {lead.email && lead.email !== "undefined" && lead.email !== "null" && (
                      <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{lead.email}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(lead.email!, 'Email')}
                          className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}

                    {(lead.location || lead.city) && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Location</p>
                          <p className="text-sm font-semibold text-gray-900">{lead.location || lead.city}</p>
                        </div>
                      </div>
                    )}

                    {lead.source && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Source</p>
                          <p className="text-sm font-semibold text-gray-900">{getSourceLabel(lead.source)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Requirements - Only show if data exists */}
            {(lead.propertyType || lead.bhkConfig || lead.carpetArea || lead.budget || lead.budgetRange || 
              lead.timeline || (lead.scopeOfWork && lead.scopeOfWork.length > 0) || 
              (lead.servicesInterested && lead.servicesInterested.length > 0)) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Project Requirements</h3>
                </div>
                <div className="p-4">
                  {/* Property Details Grid */}
                  {(lead.propertyType || lead.bhkConfig || lead.carpetArea || lead.budget || lead.budgetRange) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {lead.propertyType && (
                        <div className="p-3 bg-orange-50 rounded-lg text-center">
                          <Building2 className="w-5 h-5 text-orange-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">Type</p>
                          <p className="text-sm font-bold text-gray-900">{lead.propertyType}</p>
                        </div>
                      )}
                      {lead.bhkConfig && (
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <Home className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">Configuration</p>
                          <p className="text-sm font-bold text-gray-900">{lead.bhkConfig}</p>
                        </div>
                      )}
                      {lead.carpetArea && (
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <Ruler className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">Carpet Area</p>
                          <p className="text-sm font-bold text-gray-900">{lead.carpetArea} sqft</p>
                        </div>
                      )}
                      {(lead.budgetRange || lead.budget) && (
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <IndianRupee className="w-5 h-5 text-green-600 mx-auto mb-1.5" />
                          <p className="text-xs text-gray-500 mb-1">Budget</p>
                          <p className="text-sm font-bold text-green-700">{lead.budgetRange || lead.budget}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  {lead.timeline && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">Project Timeline</p>
                        <p className="text-sm font-semibold text-gray-900">{lead.timeline}</p>
                      </div>
                    </div>
                  )}

                  {/* Scope of Work */}
                  {lead.scopeOfWork && lead.scopeOfWork.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Scope of Work</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.scopeOfWork.map((scope, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {lead.servicesInterested && lead.servicesInterested.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Services Interested</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.servicesInterested.map((service, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Design Preferences - Only show if data exists */}
            {((lead.designStyle && lead.designStyle.length > 0) || (lead.colorPreferences && lead.colorPreferences.length > 0)) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Design Preferences</h3>
                </div>
                <div className="p-3">
                  {lead.designStyle && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Preferred Style</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(lead.designStyle) ? lead.designStyle : [lead.designStyle]).map((style, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded text-xs font-medium">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lead.colorPreferences && lead.colorPreferences.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Colors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.colorPreferences.map((color, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Notes & Communication</h3>
              </div>
              <div className="p-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    size="sm"
                    className="rounded-lg bg-orange-500 hover:bg-orange-600 text-xs px-3 py-1.5"
                  >
                    {addingNote ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    Add Note
                  </Button>
                </div>
                {lead.notes && (
                  <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-orange-50 text-left transition-colors group">
                  <div className="w-7 h-7 rounded-md bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Schedule Meeting</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-left transition-colors group">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Send Quotation</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-purple-50 text-left transition-colors group">
                  <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center">
                    <Home className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Schedule Site Visit</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-green-50 text-left transition-colors group">
                  <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Share Portfolio</span>
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Timeline</h3>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">Last Contact</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {new Date(lead.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                {lead.followUpDate && (
                  <div className="flex items-center justify-between px-2 py-1.5 bg-orange-50 rounded-md -mx-1">
                    <span className="text-xs text-orange-700 font-medium">Follow-up</span>
                    <span className="text-xs font-bold text-orange-700">
                      {new Date(lead.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                {lead.expectedStartDate && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">Expected Start</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {new Date(lead.expectedStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Recent Activities</h3>
              </div>
              <div className="p-2">
                {activities.length > 0 ? (
                  <div className="space-y-1.5">
                    {activities.slice(0, 4).map((activity) => (
                      <div key={activity.id} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-3 h-3 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900">{activity.type}</p>
                          <p className="text-[10px] text-gray-500 truncate">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">No activities yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Account Modal */}
      {showConvertModal && lead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Convert Lead to Account</h2>
                <p className="text-sm text-gray-600">
                  Transform this lead into a full account
                </p>
              </div>
              <button
                onClick={() => {
                  console.log('Close modal button clicked');
                  setShowConvertModal(false);
                }}
                className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Lead Information */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Current Lead Information</p>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {safeDisplay(lead.name, "Unknown")}
                  </p>
                  {lead.email && lead.email !== "undefined" && lead.email !== "null" && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {lead.email}
                    </p>
                  )}
                  {lead.phone && lead.phone !== "undefined" && lead.phone !== "null" && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {lead.phone}
                    </p>
                  )}
                  {lead.source && (
                    <p className="text-sm text-gray-600">
                      Source: {lead.source}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">
                      New Account Preview
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-800">
                        <span className="font-medium">Account Name:</span> {safeDisplay(lead.name, "Unknown Account")}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>This lead will be converted into an account and removed from the leads list. All contact information will be preserved.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  console.log('Cancel button clicked');
                  setShowConvertModal(false);
                }}
                disabled={isConverting}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Convert button clicked!');
                  console.log('Lead:', lead);
                  console.log('Lead ID:', lead?.id);
                  console.log('Lead Name:', lead?.name);
                  handleConvertToAccount();
                }}
                disabled={isConverting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Convert to Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
