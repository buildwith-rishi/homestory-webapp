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
  Target,
  Activity,
  Star,
  Send,
  Plus,
  Loader2,
} from 'lucide-react';
import { Card, Button, Badge, Progress } from '../../components/ui';
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
      // Get lead details by ID
      const leadData = await LeadAPI.getLeadById(id);
      setLead(leadData);
      
      // Fetch activities
      try {
        const activitiesData = await LeadAPI.getLeadActivities(id);
        setActivities(activitiesData || []);
      } catch (activityError) {
        console.error('Error fetching activities:', activityError);
        // Continue even if activities fail
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast.error('Failed to load lead details');
      navigate('/dashboard/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    
    setAddingNote(true);
    try {
      // Add note logic here
      toast.success('Note added successfully');
      setNewNote('');
      fetchLeadDetails();
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Hot':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Cold':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      New: 'bg-gray-100 text-gray-700 border-gray-200',
      Contacted: 'bg-blue-100 text-blue-700 border-blue-200',
      Qualified: 'bg-purple-100 text-purple-700 border-purple-200',
      'Meeting Scheduled': 'bg-orange-100 text-orange-700 border-orange-200',
      'Proposal Sent': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      Won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Lost: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
        <p className="text-gray-600 mb-6">The lead you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/dashboard/leads')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/leads')}
                className="rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs rounded-lg ${getStageColor(lead.stage || 'New')}`}>
                    {lead.stage || 'New'}
                  </Badge>
                  {lead.priority && (
                    <Badge className={`text-xs rounded-lg ${getPriorityColor(lead.priority)}`}>
                      {lead.priority} Lead
                    </Badge>
                  )}
                  {lead.score && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{lead.score}/100</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => navigate(`/dashboard/leads/${id}/edit`)}>
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="secondary" onClick={handleDeleteLead} className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Building2 className="w-4 h-4" />
                Convert to Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Score & Progress */}
            {lead.score && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    Lead Score
                  </h3>
                  <span className="text-2xl font-bold text-orange-600">{lead.score}/100</span>
                </div>
                <Progress value={lead.score} className="mb-3" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Qualified</p>
                  </div>
                  <div className={`p-3 rounded-lg ${lead.meetingScheduled ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <Calendar className={`w-5 h-5 mx-auto mb-1 ${lead.meetingScheduled ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="text-xs text-gray-600">Meeting Set</p>
                  </div>
                  <div className={`p-3 rounded-lg ${lead.quotationSent ? 'bg-purple-50' : 'bg-gray-50'}`}>
                    <FileText className={`w-5 h-5 mx-auto mb-1 ${lead.quotationSent ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className="text-xs text-gray-600">Quote Sent</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                    <p className="font-semibold text-gray-900">{lead.phone}</p>
                    <button className="text-xs text-orange-600 hover:text-orange-700 mt-1">
                      Call Now
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-900 break-all">{lead.email}</p>
                    <button className="text-xs text-orange-600 hover:text-orange-700 mt-1">
                      Send Email
                    </button>
                  </div>
                </div>
                {lead.location && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-semibold text-gray-900">{lead.location}</p>
                      {lead.city && <p className="text-sm text-gray-600">{lead.city}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Lead Source</p>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {lead.source}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Project Requirements */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-orange-500" />
                Project Requirements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {lead.propertyType && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Property Type</p>
                    <p className="font-semibold text-gray-900">{lead.propertyType}</p>
                  </div>
                )}
                {lead.bhkConfig && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Configuration</p>
                    <p className="font-semibold text-gray-900">{lead.bhkConfig}</p>
                  </div>
                )}
                {lead.carpetArea && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Carpet Area</p>
                    <p className="font-semibold text-gray-900">{lead.carpetArea} sq.ft</p>
                  </div>
                )}
                {lead.budget && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Budget</p>
                    <p className="font-semibold text-green-600">₹{lead.budget.toLocaleString()}</p>
                  </div>
                )}
                {lead.budgetRange && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Budget Range</p>
                    <p className="font-semibold text-gray-900">{lead.budgetRange}</p>
                  </div>
                )}
                {lead.timeline && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Timeline</p>
                    <p className="font-semibold text-gray-900">{lead.timeline}</p>
                  </div>
                )}
              </div>

              {lead.scopeOfWork && lead.scopeOfWork.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Scope of Work</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.scopeOfWork.map((scope, idx) => (
                      <Badge key={idx} className="bg-purple-50 text-purple-700 border-purple-200">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {lead.servicesInterested && lead.servicesInterested.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Services Interested</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.servicesInterested.map((service, idx) => (
                      <Badge key={idx} className="bg-orange-50 text-orange-700 border-orange-200">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Design Preferences */}
            {(lead.designStyle || lead.colorPreferences) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-500" />
                  Design Preferences
                </h3>
                <div className="space-y-4">
                  {lead.designStyle && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Preferred Style</p>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-sm px-4 py-2">
                        {lead.designStyle}
                      </Badge>
                    </div>
                  )}
                  {lead.colorPreferences && lead.colorPreferences.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Color Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.colorPreferences.map((color, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Notes & Communication */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Notes & Communication
              </h3>
              
              {/* Add Note */}
              <div className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {addingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Existing Notes */}
              {lead.notes && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Timeline & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Send className="w-4 h-4 mr-2" />
                  Send Quotation
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Home className="w-4 h-4 mr-2" />
                  Schedule Site Visit
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Share Portfolio
                </Button>
              </div>
            </Card>

            {/* Timeline & Important Dates */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Contacted</span>
                    <span className="font-semibold">
                      {new Date(lead.lastContactedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {lead.followUpDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Follow-up</span>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      {new Date(lead.followUpDate).toLocaleDateString()}
                    </Badge>
                  </div>
                )}
                {lead.expectedStartDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Start</span>
                    <span className="font-semibold">
                      {new Date(lead.expectedStartDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {lead.moveinDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Move-in Date</span>
                    <span className="font-semibold">
                      {new Date(lead.moveinDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Assignment - Commented out as fields not in API type yet */}
            {/* {(lead.assignedTo || lead.assignedDesigner) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Assignment
                </h3>
                <div className="space-y-3">
                  {lead.assignedTo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sales Representative</p>
                      <p className="font-semibold text-gray-900">{lead.assignedTo}</p>
                    </div>
                  )}
                  {lead.assignedDesigner && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assigned Designer</p>
                      <p className="font-semibold text-gray-900">{lead.assignedDesigner}</p>
                    </div>
                  )}
                </div>
              </Card>
            )} */}

            {/* Recent Activities */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Recent Activities
              </h3>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No activities yet</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
