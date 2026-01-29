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
} from 'lucide-react';
import { Button } from '../../components/ui';
import LeadAPI, { Lead as APILead, LeadActivity as APILeadActivity } from '../../services/leadApi';
import toast from 'react-hot-toast';

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<APILead | null>(null);
  const [activities, setActivities] = useState<APILeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
    }
  }, [id]);

  const fetchLeadDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const leadData = await LeadAPI.getLeadById(id);
      setLead(leadData);
      
      try {
        const activitiesData = await LeadAPI.getLeadActivities(id);
        setActivities(activitiesData || []);
      } catch (activityError) {
        console.error('Error fetching activities:', activityError);
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast.error('Failed to load lead details');
      navigate('/dashboard/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await LeadAPI.deleteLead(id);
      toast.success('Lead deleted successfully');
      navigate('/dashboard/leads');
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) return;

    setAddingNote(true);
    try {
      // Update the lead with the new note
      await LeadAPI.updateLead(id, {
        notes: lead?.notes 
          ? `${lead.notes}\n\n[${new Date().toLocaleString()}]\n${newNote.trim()}`
          : `[${new Date().toLocaleString()}]\n${newNote.trim()}`
      });
      
      toast.success('Note added successfully');
      setNewNote('');
      await fetchLeadDetails(); // Refresh lead data
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
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
        <div className="max-w-7xl mx-auto px-6">
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
          <div className="py-6">
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
                    <h1 className="text-2xl font-bold text-gray-900">{lead.name || "Unknown Lead"}</h1>
                    {lead.priority === 'high' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                        <Sparkles className="w-3 h-3" />
                        Hot Lead
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {lead.source && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-blue-700">{lead.source}</span>
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
                <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200/50">
                  <Building2 className="w-4 h-4" />
                  Convert to Project
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
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* Phone */}
                  <div className="group p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.phone || "Not provided"}</p>
                      </div>
                      {lead.phone && (
                        <button
                          onClick={() => copyToClipboard(lead.phone!, 'Phone')}
                          className="p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="group p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{lead.email || "Not provided"}</p>
                      </div>
                      {lead.email && (
                        <button
                          onClick={() => copyToClipboard(lead.email!, 'Email')}
                          className="p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.location || lead.city || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Source</p>
                        <p className="text-sm font-medium text-gray-900">{lead.source || "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Requirements */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Project Requirements</h3>
              </div>
              <div className="p-3">
                {/* Property Details Grid */}
                {(lead.propertyType || lead.bhkConfig || lead.carpetArea || lead.budget || lead.budgetRange) ? (
                  <>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="p-2.5 bg-orange-50 rounded-lg text-center">
                        <Building2 className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 mb-0.5">Type</p>
                        <p className="text-xs font-bold text-gray-900">{lead.propertyType || "-"}</p>
                      </div>
                      <div className="p-2.5 bg-blue-50 rounded-lg text-center">
                        <Home className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 mb-0.5">Config</p>
                        <p className="text-xs font-bold text-gray-900">{lead.bhkConfig || "-"}</p>
                      </div>
                      <div className="p-2.5 bg-purple-50 rounded-lg text-center">
                        <Ruler className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 mb-0.5">Area</p>
                        <p className="text-xs font-bold text-gray-900">{lead.carpetArea ? `${lead.carpetArea} sqft` : "-"}</p>
                      </div>
                      <div className="p-2.5 bg-green-50 rounded-lg text-center">
                        <IndianRupee className="w-4 h-4 text-green-600 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 mb-0.5">Budget</p>
                        <p className="text-xs font-bold text-green-700">{lead.budgetRange || lead.budget || "-"}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    {lead.timeline && (
                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg mb-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500">Timeline:</span>
                        <span className="text-xs font-semibold text-gray-900">{lead.timeline}</span>
                      </div>
                    )}

                    {/* Scope of Work */}
                    {lead.scopeOfWork && lead.scopeOfWork.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Scope of Work</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.scopeOfWork.map((scope, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    {lead.servicesInterested && lead.servicesInterested.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Services Interested</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lead.servicesInterested.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Home className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">No project requirements specified</p>
                    <button className="text-xs font-medium text-orange-600 hover:text-orange-700">
                      + Add Requirements
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Design Preferences */}
            {(lead.designStyle || lead.colorPreferences) && (
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
    </div>
  );
};

export default LeadDetails;
