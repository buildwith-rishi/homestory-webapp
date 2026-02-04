# Lead References & Inspirations Feature

## Overview
A comprehensive system for uploading and managing reference materials, inspirations, and documentation for leads. Supports images, PDFs, documents, videos, and external links (Pinterest, Houzz, Instagram, etc.).

## Features

### 1. **Multiple Upload Types**
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX
- **Videos**: MP4, MOV, AVI
- **External Links**: Pinterest, Houzz, Instagram, website links

### 2. **Categorization**
- **Inspiration**: Design ideas, mood boards, style references
- **Requirement**: Client requirements, specifications
- **Reference**: General reference materials
- **Competitor**: Competitor work examples
- **Other**: Miscellaneous files

### 3. **File Management**
- Upload multiple files at once
- File size validation (max 10MB per file)
- Automatic thumbnail generation for images
- Preview and download capabilities
- Delete unwanted references

### 4. **Link Management**
- Add external links with custom titles
- Category assignment for links
- Optional descriptions
- Direct external link opening

## Installation & Setup

### 1. Type Definitions
Already added to `/src/types/index.ts`:
- `ReferenceType` enum
- `LeadReference` interface
- `references` field in `Lead` interface

### 2. Components Created
- `LeadReferencesManager.tsx` - Main reference management component
- `LeadDetailModal.tsx` - Complete lead detail modal with tabs
- `index.ts` - Exports for easy imports

## Usage

### Basic Integration

```tsx
import { LeadDetailModal } from "../../components/leads";
import { Lead } from "../../types";

function YourLeadsPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
    );
  };

  return (
    <>
      {/* Your leads list */}
      <div onClick={() => setSelectedLead(someLeadObject)}>
        Click to view lead
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
        onUpdateLead={handleUpdateLead}
      />
    </>
  );
}
```

### Standalone References Manager

If you want to use just the references manager:

```tsx
import { LeadReferencesManager } from "../../components/leads";

function CustomComponent() {
  const [references, setReferences] = useState<LeadReference[]>([]);

  const handleAddReference = (newRef) => {
    const reference = {
      ...newRef,
      id: `ref-${Date.now()}`,
      leadId: currentLeadId,
      uploadedAt: new Date().toISOString(),
    };
    setReferences([...references, reference]);
  };

  const handleDeleteReference = (refId) => {
    setReferences(references.filter(r => r.id !== refId));
  };

  return (
    <LeadReferencesManager
      leadId={currentLeadId}
      references={references}
      onAddReference={handleAddReference}
      onDeleteReference={handleDeleteReference}
      readOnly={false}
    />
  );
}
```

## API Integration

### Backend Requirements

You'll need to implement these endpoints:

1. **Upload File**
```typescript
POST /api/leads/:leadId/references/upload
Content-Type: multipart/form-data

Response: {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
}
```

2. **Add Link**
```typescript
POST /api/leads/:leadId/references/link
Body: {
  url: string;
  title: string;
  description?: string;
  category: string;
}

Response: LeadReference
```

3. **Delete Reference**
```typescript
DELETE /api/leads/:leadId/references/:referenceId
```

### Storage Service Integration

Update the `handleFileUpload` function in `LeadReferencesManager.tsx`:

```typescript
// Replace this mock implementation:
const mockUrl = URL.createObjectURL(file);

// With actual storage service:
const formData = new FormData();
formData.append('file', file);
formData.append('leadId', leadId);

const response = await fetch(`/api/leads/${leadId}/references/upload`, {
  method: 'POST',
  body: formData,
});

const data = await response.json();
const actualUrl = data.url;
```

## Customization

### Modify File Size Limit
In `LeadReferencesManager.tsx`, line ~48:
```typescript
if (file.size > 10 * 1024 * 1024) { // Change 10 to your desired MB
  toast.error(`File too large. Max: 10MB`);
}
```

### Add New Categories
In `LeadReferencesManager.tsx`, line ~261:
```typescript
{["Inspiration", "Requirement", "Reference", "Competitor", "YourNewCategory"].map(...)}
```

### Modify Accepted File Types
In `LeadReferencesManager.tsx`, line ~202:
```typescript
accept="image/*,.pdf,.doc,.docx,video/*,.ppt,.pptx" // Add your types
```

## Styling

The components use Tailwind CSS and follow the existing design system:
- Orange accent color for primary actions
- Gradient backgrounds for upload areas
- Hover effects and smooth transitions
- Responsive grid layouts
- Professional card-based UI

## Features in Detail

### Upload Area
- Drag-and-drop ready (can be enabled)
- Multiple file selection
- Loading state with spinner
- Success feedback with toast

### Reference Cards
- Image previews with aspect ratio
- File type icons
- Category badges with color coding
- File size and upload date
- Hover actions (view, download, delete)
- Grouped by category

### Link Addition
- URL validation
- Custom title and description
- Category selection
- Collapsible form

### Empty States
- Helpful placeholder when no references
- Clear call-to-action
- Visual icon indicator

## Testing

Test the following scenarios:
1. Upload single image
2. Upload multiple files
3. Upload large file (should show error)
4. Add external link (Pinterest, Instagram)
5. Delete reference
6. Switch between categories
7. View in read-only mode
8. Check responsive layout on mobile

## Future Enhancements

Potential features to add:
- Drag-and-drop file upload
- Bulk actions (select multiple, delete all)
- Reference sharing via email
- AI-powered image tagging
- Reference search and filter
- Reference versioning
- Folder/album organization
- Comments on references
- Reference comparison view

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify file types and sizes
3. Ensure Lead object has `references` field initialized
4. Check network tab for API call failures
