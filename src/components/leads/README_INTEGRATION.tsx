// Example integration for Leads page

import { useState } from "react";
import { LeadDetailModal } from "../../components/leads";
import { Lead } from "../../types";

// In your Leads component:
export const LeadsPageExample = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([
    // Your leads data
  ]);

  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
    );
  };

  return (
    <div>
      {/* Your leads list */}
      <div className="grid gap-4">
        {leads.map(lead => (
          <div
            key={lead.id}
            onClick={() => setSelectedLead(lead)}
            className="p-4 border rounded-lg cursor-pointer hover:shadow-lg"
          >
            <h3>{lead.name}</h3>
            <p>{lead.email}</p>
          </div>
        ))}
      </div>

      {/* Lead Detail Modal with References */}
      <LeadDetailModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onUpdateLead={handleUpdateLead}
      />
    </div>
  );
};

// ============================================
// USAGE INSTRUCTIONS
// ============================================

/**
 * 1. Import the components:
 *    import { LeadDetailModal } from "../../components/leads";
 * 
 * 2. Add state for selected lead:
 *    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
 * 
 * 3. Add the modal to your component:
 *    <LeadDetailModal
 *      isOpen={!!selectedLead}
 *      onClose={() => setSelectedLead(null)}
 *      lead={selectedLead}
 *      onUpdateLead={handleUpdateLead}
 *    />
 * 
 * 4. When clicking a lead card, set it as selected:
 *    onClick={() => setSelectedLead(lead)}
 * 
 * 5. The References tab will show:
 *    - File upload area (images, PDFs, docs, videos up to 10MB)
 *    - Link addition form (Pinterest, Houzz, Instagram, etc.)
 *    - Categorized references (Inspiration, Requirement, Reference, Competitor)
 *    - Preview thumbnails for images
 *    - Download/view/delete actions
 *    - File size and upload date info
 */
