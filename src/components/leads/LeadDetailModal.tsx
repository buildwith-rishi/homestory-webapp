import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  TrendingUp,
  MessageSquare,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import { Modal, Button, Badge, Card } from "../ui";
import { Lead, LeadReference } from "../../types";
import { LeadReferencesManager } from "./LeadReferencesManager";
import toast from "react-hot-toast";

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  onUpdateLead,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "references" | "activities">("details");
  const [references, setReferences] = useState<LeadReference[]>(lead?.references || []);

  if (!lead) return null;

  const handleAddReference = (newRef: Omit<LeadReference, "id" | "leadId" | "uploadedAt">) => {
    const reference: LeadReference = {
      ...newRef,
      id: `ref-${Date.now()}`,
      leadId: lead.id,
      uploadedAt: new Date().toISOString(),
    };
    
    const updatedRefs = [...references, reference];
    setReferences(updatedRefs);
    
    if (onUpdateLead) {
      onUpdateLead(lead.id, { references: updatedRefs });
    }
  };

  const handleDeleteReference = (referenceId: string) => {
    const updatedRefs = references.filter(ref => ref.id !== referenceId);
    setReferences(updatedRefs);
    
    if (onUpdateLead) {
      onUpdateLead(lead.id, { references: updatedRefs });
    }
    
    toast.success("Reference deleted successfully");
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "Hot":
        return "bg-red-100 text-red-700";
      case "Warm":
        return "bg-orange-100 text-orange-700";
      case "Cold":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      inquiry: "bg-gray-100 text-gray-700",
      contacted: "bg-blue-100 text-blue-700",
      meeting_scheduled: "bg-purple-100 text-purple-700",
      proposal_sent: "bg-orange-100 text-orange-700",
      negotiation: "bg-yellow-100 text-yellow-700",
      won: "bg-emerald-100 text-emerald-700",
      lost: "bg-red-100 text-red-700",
    };
    return stageColors[stage] || "bg-gray-100 text-gray-700";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" showCloseButton={false}>
      <div className="flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-sm">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="info" className={getStageColor(lead.stage)}>
                  {lead.stage.replace(/_/g, " ")}
                </Badge>
                {lead.priority && (
                  <Badge className={getPriorityColor(lead.priority)}>
                    {lead.priority}
                  </Badge>
                )}
                {lead.score && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Score: {lead.score}/100
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("references")}
              className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "references"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              References & Inspirations
              {references.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {references.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "activities"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Activity className="w-4 h-4" />
              Activities
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl">
              {/* Contact Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{lead.phone}</span>
                  </div>
                  {lead.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{lead.location}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Project Details */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h3>
                <div className="space-y-3">
                  {lead.propertyType && (
                    <div className="flex items-center gap-3 text-sm">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Property:</span>
                      <span className="text-gray-900 font-medium">{lead.propertyType}</span>
                    </div>
                  )}
                  {lead.bhkConfig && (
                    <div className="flex items-center gap-3 text-sm">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Configuration:</span>
                      <span className="text-gray-900 font-medium">{lead.bhkConfig}</span>
                    </div>
                  )}
                  {lead.budget && (
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Budget:</span>
                      <span className="text-gray-900 font-medium">₹{lead.budget.toLocaleString()}</span>
                    </div>
                  )}
                  {lead.carpetArea && (
                    <div className="flex items-center gap-3 text-sm">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Carpet Area:</span>
                      <span className="text-gray-900 font-medium">{lead.carpetArea} sq.ft</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Design Preferences */}
              {lead.designStyle && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Design Preferences</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Style:</span>
                      <div className="mt-1">
                        <Badge variant="info" className="bg-purple-100 text-purple-700">
                          {lead.designStyle}
                        </Badge>
                      </div>
                    </div>
                    {lead.colorPreferences && lead.colorPreferences.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Colors:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {lead.colorPreferences.map((color, idx) => (
                            <Badge key={idx} variant="neutral" className="bg-gray-100 text-gray-700">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Timeline */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-3">
                  {lead.followUpDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Follow-up:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(lead.followUpDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {lead.expectedStartDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Expected Start:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(lead.expectedStartDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {lead.lastContactedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Last Contact:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(lead.lastContactedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Notes */}
              {lead.notes && (
                <Card className="p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "references" && (
            <div className="max-w-7xl">
              <LeadReferencesManager
                leadId={lead.id}
                references={references}
                onAddReference={handleAddReference}
                onDeleteReference={handleDeleteReference}
              />
            </div>
          )}

          {activeTab === "activities" && (
            <div className="max-w-4xl">
              <Card className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No activities yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Activities will appear here once you start interacting with this lead
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => toast.success("Lead updated!")}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
