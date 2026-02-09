import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Edit2,
  Save,
  Award,
  MessageCircle,
  Briefcase,
  UserPlus,
  Gift,
  Trash2,
  FileText,
  Clock,
  Users,
  CheckCircle2,
  FolderOpen,
  Upload,
  X,
  Plus,
  Contact2,
  AlertCircle,
} from "lucide-react";
import { Button, Badge, Card } from "../../components/ui";
import toast from "react-hot-toast";
import { ContactsList } from "../../components/customers";
import ContactAPI, { type Contact } from "../../services/contactApi";
import CustomerAPI, { Customer as APICustomer, type CustomerContact } from "../../services/customerApi";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: string;
  occupation?: string;
}

interface ImportantDate {
  title: string;
  date: string;
  type: "birthday" | "anniversary" | "other";
}

interface Referral {
  name: string;
  phone: string;
  status: "contacted" | "converted" | "pending";
  date: string;
}

interface Note {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface AssignedProject {
  id: string;
  name: string;
  status: "active" | "on_hold" | "completed";
  progress: number;
}

interface Customer {
  id: string | number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  projects: number;
  totalValue: number;
  status: "active" | "completed" | "inactive";
  rating: number;
  lastContact: string;
  photoUrl?: string;
  alternatePhone?: string;
  address?: string;
  familyMembers?: FamilyMember[];
  importantDates?: ImportantDate[];
  referrals?: Referral[];
  clientRanking?: "niche" | "regular" | "one-time" | "vip";
  communicationPreference?: "email" | "phone" | "whatsapp" | "in-person";
  notes?: Note[];
  occupation?: string;
  companyName?: string;
  assignedProjects?: AssignedProject[];
  leadId?: string; // Store the lead ID for fetching contacts
  type?: string;
  taxId?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  contactsCount?: number;
  projectsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Mock projects list - in production, this would come from API
const mockProjectsList: AssignedProject[] = [
  {
    id: "p1",
    name: "Villa Renovation - HSR Layout",
    status: "active",
    progress: 65,
  },
  {
    id: "p2",
    name: "Modern Home - Whitefield",
    status: "active",
    progress: 30,
  },
  {
    id: "p3",
    name: "Office Interior - Koramangala",
    status: "completed",
    progress: 100,
  },
  {
    id: "p4",
    name: "Apartment Design - Indiranagar",
    status: "on_hold",
    progress: 45,
  },
  {
    id: "p5",
    name: "Farmhouse Project - Devanahalli",
    status: "active",
    progress: 15,
  },
  { id: "p6", name: "Retail Store - MG Road", status: "active", progress: 80 },
];

// Mock data - in production, this would come from API
const mockCustomers: Customer[] = [
  {
    id: 1,
    name: "Rajesh Sharma",
    initials: "RS",
    email: "rajesh@email.com",
    phone: "+91 98765 43210",
    alternatePhone: "+91 98765 43299",
    location: "HSR Layout",
    address: "123, 5th Main Road, HSR Layout, Bangalore - 560102",
    projects: 2,
    totalValue: 3800000,
    status: "active",
    rating: 5,
    lastContact: "2 days ago",
    occupation: "IT Manager",
    companyName: "Tech Solutions Pvt Ltd",
    clientRanking: "vip",
    communicationPreference: "phone",
    familyMembers: [
      {
        name: "Priya Sharma",
        relationship: "Spouse",
        age: "34",
        occupation: "Teacher",
      },
      { name: "Aarav Sharma", relationship: "Son", age: "8" },
    ],
    importantDates: [
      { title: "Birthday", date: "1990-05-15", type: "birthday" },
      { title: "Anniversary", date: "2015-12-20", type: "anniversary" },
    ],
    referrals: [
      {
        name: "Amit Verma",
        phone: "+91 98765 12345",
        status: "converted",
        date: "2025-10-15",
      },
      {
        name: "Sneha Reddy",
        phone: "+91 98765 54321",
        status: "contacted",
        date: "2026-01-05",
      },
    ],
    notes: [
      {
        id: 1,
        content: "Prefers modern minimalist designs",
        createdBy: "AR",
        createdAt: "2026-01-15",
      },
      {
        id: 2,
        content: "Budget flexible, values quality",
        createdBy: "PK",
        createdAt: "2026-01-10",
      },
    ],
    assignedProjects: [
      {
        id: "p1",
        name: "Villa Renovation - HSR Layout",
        status: "active",
        progress: 65,
      },
      {
        id: "p2",
        name: "Modern Home - Whitefield",
        status: "active",
        progress: 30,
      },
    ],
  },
  {
    id: 2,
    name: "Priya Kumar",
    initials: "PK",
    email: "priya@email.com",
    phone: "+91 98765 43211",
    location: "Whitefield",
    address: "456, Brigade Road, Whitefield, Bangalore - 560066",
    projects: 1,
    totalValue: 4200000,
    status: "active",
    rating: 4.8,
    lastContact: "1 week ago",
    occupation: "Entrepreneur",
    clientRanking: "niche",
    communicationPreference: "email",
  },
  {
    id: 3,
    name: "Amit Patel",
    initials: "AP",
    email: "amit@email.com",
    phone: "+91 98765 43212",
    location: "Indiranagar",
    projects: 3,
    totalValue: 6500000,
    status: "completed",
    rating: 4.9,
    lastContact: "3 days ago",
  },
  {
    id: 4,
    name: "Sneha Reddy",
    initials: "SR",
    email: "sneha@email.com",
    phone: "+91 98765 43213",
    location: "Koramangala",
    projects: 1,
    totalValue: 2900000,
    status: "active",
    rating: 4.7,
    lastContact: "5 days ago",
  },
];

const statusColors = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};

const rankingColors = {
  vip: { bg: "bg-purple-100", text: "text-purple-700", icon: "👑" },
  niche: { bg: "bg-orange-100", text: "text-orange-700", icon: "⭐" },
  regular: { bg: "bg-blue-100", text: "text-blue-700", icon: "👤" },
  "one-time": { bg: "bg-gray-100", text: "text-gray-700", icon: "📋" },
};

export const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "contacts"
    | "family"
    | "dates"
    | "referrals"
    | "notes"
    | "ranking"
    | "projects"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Modal states
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Form states
  const [familyForm, setFamilyForm] = useState({
    name: "",
    relationship: "",
    age: "",
    occupation: "",
  });
  const [dateForm, setDateForm] = useState({
    title: "",
    date: "",
    type: "birthday" as "birthday" | "anniversary" | "other",
  });
  const [referralForm, setReferralForm] = useState({
    name: "",
    phone: "",
    status: "pending" as "contacted" | "converted" | "pending",
    date: new Date().toISOString().split("T")[0],
  });
  const [noteForm, setNoteForm] = useState({
    content: "",
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Local customer data (in production, this would sync with backend)
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Initialize customer data from API
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) {
        console.error("No customer ID provided");
        return;
      }
      
      console.log("Fetching customer data for ID:", customerId);
      setLoadingCustomer(true);
      try {
        const apiCustomer = await CustomerAPI.getCustomerById(customerId);
        console.log("API Customer response:", apiCustomer);
        
        if (!apiCustomer) {
          throw new Error("No customer data received from API");
        }
        
        // Map API customer to UI format
        const customerName = apiCustomer.name || "Unknown Customer";
        const initials = customerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        // Extract email/phone from contacts array if available
        const apiContacts = apiCustomer.contacts || [];
        const primaryContact = apiContacts.find(c => c.isPrimary) || apiContacts[0];
        const customerEmail = primaryContact?.email || apiCustomer.convertedFromLead?.email || "";
        const customerPhone = primaryContact?.phone || apiCustomer.convertedFromLead?.phone || "";

        // Map family members from API
        const apiFamilyMembers: FamilyMember[] = (apiCustomer.familyMembers || []).map((fm: any) => ({
          name: fm.name || "",
          relationship: fm.relationship || "",
          age: fm.age || undefined,
          occupation: fm.occupation || undefined,
        }));

        // Map important dates from API
        const apiImportantDates: ImportantDate[] = (apiCustomer.importantDates || []).map((d: any) => ({
          title: d.title || "",
          date: d.date || "",
          type: (d.type as "birthday" | "anniversary" | "other") || "other",
        }));

        // Map projects from API
        const apiProjects: AssignedProject[] = (apiCustomer.projects || []).map((p: any) => ({
          id: p.id,
          name: p.name || "Unnamed Project",
          status: (p.status?.toLowerCase() as "active" | "on_hold" | "completed") || "active",
          progress: p.progress || 0,
        }));

        // Build location from available address fields
        const locationParts = [
          apiCustomer.billingCity || apiCustomer.shippingCity,
          apiCustomer.billingState || apiCustomer.shippingState,
        ].filter(Boolean);
        const location = locationParts.length > 0 ? locationParts.join(", ") : apiCustomer.billingAddress || apiCustomer.shippingAddress || "N/A";

        const mappedCustomer: Customer = {
          id: apiCustomer.id, // Keep UUID as string
          name: customerName,
          initials,
          email: customerEmail,
          phone: customerPhone,
          location,
          projects: apiCustomer._count?.projects || apiProjects.length || 0,
          totalValue: 0,
          status: (apiCustomer.status?.toLowerCase() as "active" | "completed" | "inactive") || "active",
          rating: 0,
          lastContact: apiCustomer.updatedAt ? new Date(apiCustomer.updatedAt).toLocaleDateString() : "N/A",
          photoUrl: undefined,
          alternatePhone: undefined,
          address: apiCustomer.billingAddress || apiCustomer.shippingAddress || undefined,
          familyMembers: apiFamilyMembers,
          importantDates: apiImportantDates,
          referrals: [],
          clientRanking: undefined,
          communicationPreference: undefined,
          notes: apiCustomer.notes ? [{ id: 1, content: apiCustomer.notes, createdBy: "System", createdAt: apiCustomer.createdAt || "" }] : [],
          occupation: undefined,
          companyName: undefined,
          assignedProjects: apiProjects,
          leadId: apiCustomer.convertedFromLeadId || undefined,
          type: apiCustomer.type,
          taxId: apiCustomer.taxId,
          billingAddress: apiCustomer.billingAddress,
          billingCity: apiCustomer.billingCity,
          billingState: apiCustomer.billingState,
          billingPincode: apiCustomer.billingPincode,
          shippingAddress: apiCustomer.shippingAddress,
          shippingCity: apiCustomer.shippingCity,
          shippingState: apiCustomer.shippingState,
          shippingPincode: apiCustomer.shippingPincode,
          ownerId: apiCustomer.ownerId,
          ownerName: apiCustomer.owner?.name,
          ownerEmail: apiCustomer.owner?.email,
          contactsCount: apiCustomer._count?.contacts || apiContacts.length || 0,
          projectsCount: apiCustomer._count?.projects || apiProjects.length || 0,
          createdAt: apiCustomer.createdAt,
          updatedAt: apiCustomer.updatedAt,
        };
        
        setCustomerData(mappedCustomer);
        console.log("Customer data mapped successfully:", mappedCustomer);
      } catch (error) {
        console.error("Failed to fetch customer. Error details:", error);
        console.error("Customer ID attempted:", customerId);
        
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to load customer details: ${errorMessage}`);
        
        // Navigate back after a short delay to allow user to see error
        setTimeout(() => {
          navigate("/dashboard/customers");
        }, 2000);
      } finally {
        setLoadingCustomer(false);
      }
    };
    
    fetchCustomerData();
  }, [customerId, navigate]);

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    if (!customerData?.id) return;

    setLoadingContacts(true);
    try {
      // Use the customer's leadId if available, otherwise use customer ID
      const leadIdToUse = customerData.leadId || String(customerData.id);
      const response = await ContactAPI.listContacts({ leadId: leadIdToUse });
      const fetchedContacts = response.contacts || [];
      
      if (fetchedContacts.length > 0) {
        setContacts(fetchedContacts);
        
        // Update customer email and phone from the primary contact
        const primaryContact = fetchedContacts.find(c => c.isPrimary) || fetchedContacts[0];
        setCustomerData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            email: primaryContact.email || prev.email || "No email provided",
            phone: primaryContact.phone || prev.phone || "No phone provided",
          };
        });
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      // Don't show error toast on initial load - contacts may not exist yet
    } finally {
      setLoadingContacts(false);
    }
  }, [customerData?.id, customerData?.leadId]);

  // Load contacts when customerData changes (but only once per customer)
  useEffect(() => {
    if (customerData?.id) {
      fetchContacts();
    }
  }, [customerData?.id, customerData?.leadId, fetchContacts]);

  const customer = customerData;

  // Save customer data to backend
  const handleSaveCustomer = async (updates: Partial<Customer>) => {
    if (!customer || isSaving) return;

    setIsSaving(true);
    const previousData = { ...customer };

    // Optimistic update
    setCustomerData((prev) => (prev ? { ...prev, ...updates } : prev));

    try {
      // Map UI fields to API fields
      const apiUpdates: any = {};
      
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.status !== undefined) apiUpdates.status = updates.status.toUpperCase();
      if (updates.notes !== undefined) {
        apiUpdates.notes = updates.notes && updates.notes.length > 0
          ? updates.notes.map(n => n.content).join('\n')
          : null;
      }
      if (updates.familyMembers !== undefined) {
        apiUpdates.familyMembers = updates.familyMembers;
      }
      if (updates.importantDates !== undefined) {
        apiUpdates.importantDates = updates.importantDates;
      }
      if (updates.clientRanking !== undefined) {
        // Store in notes or custom field if available
        const rankingNote = `Client Ranking: ${updates.clientRanking}`;
        apiUpdates.notes = apiUpdates.notes ? `${apiUpdates.notes}\n${rankingNote}` : rankingNote;
      }

      await CustomerAPI.updateCustomer(String(customer.id), apiUpdates);
      toast.success('Customer updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      // Rollback
      setCustomerData(previousData);
      toast.error(error?.message || 'Failed to save changes');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers
  const handleAddFamily = async () => {
    if (!customer || !familyForm.name || !familyForm.relationship) return;

    const newMember = {
      name: familyForm.name,
      relationship: familyForm.relationship,
      age: familyForm.age || undefined,
      occupation: familyForm.occupation || undefined,
    };

    const updatedFamilyMembers = [...(customer.familyMembers || []), newMember];

    const success = await handleSaveCustomer({ familyMembers: updatedFamilyMembers });
    
    if (success) {
      setFamilyForm({ name: "", relationship: "", age: "", occupation: "" });
      setShowFamilyModal(false);
      toast.success("Family member added successfully!");
    }
  };

  const handleAddDate = async () => {
    if (!customer || !dateForm.title || !dateForm.date) return;

    const newDate = {
      title: dateForm.title,
      date: dateForm.date,
      type: dateForm.type,
    };

    const updatedDates = [...(customer.importantDates || []), newDate];

    const success = await handleSaveCustomer({ importantDates: updatedDates });
    
    if (success) {
      setDateForm({ title: "", date: "", type: "birthday" });
      setShowDateModal(false);
      toast.success("Important date added successfully!");
    }
  };

  const handleAddReferral = async () => {
    if (!customer || !referralForm.name || !referralForm.phone) return;

    const newReferral = {
      name: referralForm.name,
      phone: referralForm.phone,
      status: referralForm.status,
      date: referralForm.date,
    };

    // For now, store referrals in notes since backend doesn't have referral field
    const referralNote = `Referral: ${newReferral.name} (${newReferral.phone}) - ${newReferral.status}`;
    const existingNotes = customer.notes || [];
    const updatedNotes = [...existingNotes, {
      id: Date.now(),
      content: referralNote,
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
    }];

    // Also update referrals array for UI
    const updatedReferrals = [...(customer.referrals || []), newReferral];
    
    // Optimistic update for UI
    setCustomerData((prev) => prev ? {
      ...prev,
      referrals: updatedReferrals,
      notes: updatedNotes,
    } : prev);

    const success = await handleSaveCustomer({ notes: updatedNotes });
    
    if (success) {
      setReferralForm({
        name: "",
        phone: "",
        status: "pending",
        date: new Date().toISOString().split("T")[0],
      });
      setShowReferralModal(false);
      toast.success("Referral added successfully!");
    }
  };

  const handleAddNote = async () => {
    if (!customer || !noteForm.content) return;

    const newNote = {
      id: Date.now(),
      content: noteForm.content,
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(customer.notes || []), newNote];

    const success = await handleSaveCustomer({ notes: updatedNotes });
    
    if (success) {
      setNoteForm({ content: "" });
      setShowNoteModal(false);
      toast.success("Note added successfully!");
    }
  };

  // Handle photo upload
  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !customer) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create a preview URL (in production, you'd upload to a server)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoUrl = reader.result as string;
      // Note: The backend API doesn't support photoUrl field yet
      // So we just update local state for now
      setCustomerData((prev) => prev ? { ...prev, photoUrl } : prev);
      toast.success("Photo uploaded successfully!");
      // TODO: Upload to server and save photoUrl when backend supports it
    };
    reader.readAsDataURL(file);
  };

  // Handle remove photo
  const handleRemovePhoto = async () => {
    if (!customer) return;
    // Note: The backend API doesn't support photoUrl field yet
    // So we just update local state for now
    setCustomerData((prev) => prev ? { ...prev, photoUrl: undefined } : prev);
    toast.success("Photo removed successfully!");
    // TODO: Update backend when photoUrl field is supported
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!customer || isDeleting) return;

    setIsDeleting(true);

    try {
      // Call API to delete customer
      await CustomerAPI.deleteCustomer(String(customer.id));
      
      // Show success toast
      toast.success(`Customer "${customer.name}" deleted successfully!`);
      
      // Navigate back to customers list after short delay
      setTimeout(() => {
        navigate("/dashboard/customers");
      }, 500);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      
      // Show error toast with specific message
      const errorMessage = error?.message || 'Failed to delete customer';
      toast.error(errorMessage);
      
      // Keep dialog open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle assign project
  const handleAssignProject = () => {
    if (!customer || !selectedProjectId) return;

    // Check if project is already assigned
    const isAlreadyAssigned = customer.assignedProjects?.some(
      (p) => p.id === selectedProjectId,
    );

    if (isAlreadyAssigned) {
      toast.error("This project is already assigned to this customer");
      return;
    }

    const projectToAssign = mockProjectsList.find(
      (p) => p.id === selectedProjectId,
    );

    if (!projectToAssign) return;

    // Note: Project assignment is handled server-side through project management
    // This is just updating the local UI
    setCustomerData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignedProjects: [...(prev.assignedProjects || []), projectToAssign],
        projects: (prev.projects || 0) + 1,
      };
    });
    setSelectedProjectId("");
    setShowProjectModal(false);
    toast.success(`Project "${projectToAssign.name}" assigned successfully!`);
    // TODO: Call backend API to assign project when endpoint is available
  };

  // Handle remove project
  const handleRemoveProject = (projectId: string) => {
    if (!customer) return;

    // Note: Project removal is handled server-side through project management
    // This is just updating the local UI
    setCustomerData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        assignedProjects: prev.assignedProjects?.filter(
          (p) => p.id !== projectId,
        ),
        projects: Math.max((prev.projects || 0) - 1, 0),
      };
    });
    toast.success("Project removed from customer");
    // TODO: Call backend API to unassign project when endpoint is available
  };

  // Get available projects (not already assigned)
  const availableProjects = mockProjectsList.filter(
    (p) => !customer?.assignedProjects?.some((ap) => ap.id === p.id),
  );

  // Find customer by ID
  // const customer = mockCustomers.find((c) => c.id === Number(customerId));

  if (loadingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Customer Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The customer you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/dashboard/customers")}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const statusColor = statusColors[customer.status];
  const rankingColor = customer.clientRanking
    ? rankingColors[customer.clientRanking]
    : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/customers")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Customers
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isEditing) {
                // When clicking Save, just toggle edit mode
                // Individual changes are already saved via handleSaveCustomer
                setIsEditing(false);
                toast.success('Changes saved!');
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isEditing
                ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </>
            )}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
        {/* Subtle accent bar */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.name}
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {customer.initials}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-white" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {customer.name}
                    </h1>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                      {customer.status}
                    </span>
                    {rankingColor && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${rankingColor.bg} ${rankingColor.text}`}>
                        {rankingColor.icon} {customer.clientRanking}
                      </span>
                    )}
                  </div>
                  {(customer.occupation || customer.companyName) && (
                    <p className="text-sm text-gray-500">
                      {customer.occupation}{customer.occupation && customer.companyName ? ' at ' : ''}{customer.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {customer.phone}
                  </a>
                )}
                {customer.location && customer.location !== 'N/A' && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {customer.location}
                  </span>
                )}
                {customer.lastContact && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Last contact: {customer.lastContact}
                  </span>
                )}
              </div>

              {/* Rating */}
              {customer.rating > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(customer.rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-medium text-gray-400 ml-1">
                    {customer.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-0 mt-8 pt-6 border-t border-gray-100">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">{customer.projectsCount || customer.projects}</p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">Projects</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">{customer.contactsCount || 0}</p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">Contacts</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">₹{(customer.totalValue / 100000).toFixed(1)}L</p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Customer Information */}
      {(customer.type || customer.ownerName || customer.billingAddress || customer.shippingAddress || customer.taxId || customer.createdAt) && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-5">
            {customer.type && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Customer Type</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{customer.type.toLowerCase()}</p>
              </div>
            )}
            {customer.taxId && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Tax ID</p>
                <p className="text-sm font-semibold text-gray-900">{customer.taxId}</p>
              </div>
            )}
            {customer.ownerName && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Account Owner</p>
                <p className="text-sm font-semibold text-gray-900">{customer.ownerName}</p>
                {customer.ownerEmail && (
                  <p className="text-xs text-gray-500 mt-0.5">{customer.ownerEmail}</p>
                )}
              </div>
            )}
            {customer.createdAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Created</p>
                <p className="text-sm font-semibold text-gray-900">{new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(customer.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
            {customer.updatedAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900">{new Date(customer.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(customer.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
            {(customer.billingAddress || customer.billingCity) && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Billing Address</p>
                <p className="text-sm text-gray-900">{customer.billingAddress}</p>
                {(customer.billingCity || customer.billingState || customer.billingPincode) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[customer.billingCity, customer.billingState, customer.billingPincode].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
            {(customer.shippingAddress || customer.shippingCity) && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Shipping Address</p>
                <p className="text-sm text-gray-900">{customer.shippingAddress}</p>
                {(customer.shippingCity || customer.shippingState || customer.shippingPincode) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[customer.shippingCity, customer.shippingState, customer.shippingPincode].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl overflow-x-auto">
        {[
          { key: "overview", label: "Overview", icon: FileText },
          { key: "contacts", label: "Contacts", icon: Contact2 },
          { key: "family", label: "Family", icon: Users },
          { key: "dates", label: "Dates", icon: Calendar },
          { key: "referrals", label: "Referrals", icon: UserPlus },
          { key: "notes", label: "Notes", icon: MessageCircle },
          { key: "ranking", label: "Ranking", icon: Award },
          { key: "projects", label: "Projects", icon: FolderOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Contact Information */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{customer.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Phone</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  {customer.alternatePhone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Alternate Phone</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{customer.alternatePhone}</p>
                      </div>
                    </div>
                  )}
                  {customer.communicationPreference && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Preferred Contact</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{customer.communicationPreference}</p>
                      </div>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl md:col-span-2">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Address</p>
                        <p className="text-sm font-medium text-gray-900">{customer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              {(customer.occupation || customer.companyName) && (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                    Professional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {customer.occupation && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Occupation</p>
                          <p className="text-sm font-medium text-gray-900">{customer.occupation}</p>
                        </div>
                      </div>
                    )}
                    {customer.companyName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Company</p>
                          <p className="text-sm font-medium text-gray-900">{customer.companyName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Contacts Tab */}
          {activeTab === "contacts" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                Contacts
                {contacts.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
                    {contacts.length}
                  </span>
                )}
              </h3>
              <ContactsList
                leadId={customerId || ""}
                contacts={contacts}
                isLoading={loadingContacts}
                isEditable={isEditing}
                onContactsChanged={fetchContacts}
              />
            </div>
          )}

          {activeTab === "family" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                Family Members
              </h3>
              {customer.familyMembers && customer.familyMembers.length > 0 ? (
                <div className="space-y-3">
                  {customer.familyMembers.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-sm font-semibold text-orange-600">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.relationship}{member.occupation ? ` \u00b7 ${member.occupation}` : ''}</p>
                        </div>
                      </div>
                      {member.age && (
                        <span className="text-xs font-medium text-gray-400">Age {member.age}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No family members added</p>
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => setShowFamilyModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 border border-dashed border-orange-300 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Family Member
                </button>
              )}
            </div>
          )}

          {activeTab === "dates" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Important Dates
              </h3>
              {customer.importantDates && customer.importantDates.length > 0 ? (
                <div className="space-y-3">
                  {customer.importantDates.map((date, index) => {
                    const icons = {
                      birthday: "🎂",
                      anniversary: "💐",
                      other: "📅",
                    };
                    return (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icons[date.type]}</span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {date.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(date.date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No important dates added
                </p>
              )}
              {isEditing && (
                <Button
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowDateModal(true)}
                >
                  <Gift className="w-4 h-4" />
                  Add Important Date
                </Button>
              )}
            </Card>
          )}

          {activeTab === "referrals" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                Referrals
              </h3>
              {customer.referrals && customer.referrals.length > 0 ? (
                <div className="space-y-3">
                  {customer.referrals.map((referral, index) => {
                    const statusStyles = {
                      converted: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
                      contacted: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
                      pending: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
                    };
                    const style = statusStyles[referral.status];
                    return (
                      <div key={index} className="p-4 bg-gray-50/80 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{referral.name}</p>
                          <p className="text-xs text-gray-500">{referral.phone} \u00b7 {new Date(referral.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {referral.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <UserPlus className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No referrals yet</p>
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 border border-dashed border-orange-300 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Referral
                </button>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                Notes
              </h3>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-3">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-sm text-gray-900 leading-relaxed">{note.content}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span className="font-medium">{note.createdBy}</span>
                        <span>&middot;</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notes added</p>
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 border border-dashed border-orange-300 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              )}
            </div>
          )}

          {/* Ranking Tab */}
          {activeTab === "ranking" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                Client Ranking
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(["vip", "niche", "regular", "one-time"] as const).map(
                  (rank) => {
                    const isSelected = customer.clientRanking === rank;
                    const config = {
                      vip: { color: 'purple', label: 'VIP', desc: 'High-value client' },
                      niche: { color: 'blue', label: 'Niche', desc: 'Specialized projects' },
                      regular: { color: 'emerald', label: 'Regular', desc: 'Standard client' },
                      'one-time': { color: 'gray', label: 'One-time', desc: 'Single project' },
                    };
                    const c = config[rank];
                    return (
                      <button
                        key={rank}
                        onClick={async () => {
                          if (isEditing && !isSaving) {
                            await handleSaveCustomer({ clientRanking: rank });
                            toast.success(`Client ranking updated to ${rank}`);
                          }
                        }}
                        disabled={!isEditing || isSaving}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-orange-400 bg-orange-50/50'
                            : 'border-gray-100 hover:border-gray-200'
                        } ${!isEditing || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <p className="text-sm font-semibold text-gray-900 capitalize mb-0.5">{c.label}</p>
                        <p className="text-xs text-gray-400">{c.desc}</p>
                      </button>
                    );
                  },
                )}
              </div>
              {!isEditing && (
                <p className="text-xs text-gray-400 mt-4 text-center">Click "Edit" to change ranking</p>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Assigned Projects
                </h3>
                {isEditing && (
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign
                  </button>
                )}
              </div>

              {/* Project Selection Dropdown (when in edit mode) */}
              {showProjectModal && isEditing && (
                <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Select a project to assign
                  </h4>
                  <div className="space-y-3">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">-- Select a Project --</option>
                      {availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.status})
                        </option>
                      ))}
                    </select>
                    {availableProjects.length === 0 && (
                      <p className="text-sm text-gray-500">
                        All projects have been assigned to this customer.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        disabled={!selectedProjectId}
                        onClick={handleAssignProject}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setShowProjectModal(false);
                          setSelectedProjectId("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned Projects List */}
              {customer.assignedProjects &&
              customer.assignedProjects.length > 0 ? (
                <div className="space-y-3">
                  {customer.assignedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            project.status === "active"
                              ? "bg-blue-100 text-blue-600"
                              : project.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {project.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge
                              className={`text-xs ${
                                project.status === "active"
                                  ? "bg-blue-100 text-blue-700"
                                  : project.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {project.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {project.progress}% complete
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-24 hidden sm:block">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                project.progress >= 100
                                  ? "bg-green-500"
                                  : project.progress >= 50
                                    ? "bg-blue-500"
                                    : "bg-orange-500"
                              }`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveProject(project.id)}
                          className="ml-3 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove project"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No projects assigned to this customer
                  </p>
                  {isEditing && (
                    <Button
                      className="mt-4 bg-orange-500 hover:bg-orange-600"
                      onClick={() => setShowProjectModal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Assign First Project
                    </Button>
                  )}
                </div>
              )}

              {!isEditing &&
                customer.assignedProjects &&
                customer.assignedProjects.length > 0 && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Click "Edit" to manage project assignments
                  </p>
                )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-colors">
                <Phone className="w-4 h-4" />
                Call Customer
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors">
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 ring-4 ring-orange-50" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Project milestone completed
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 ring-4 ring-blue-50" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Payment received
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">5 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 ring-4 ring-green-50" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Meeting scheduled
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Family Member Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Family Member
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={familyForm.name}
                  onChange={(e) =>
                    setFamilyForm({ ...familyForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  value={familyForm.relationship}
                  onChange={(e) =>
                    setFamilyForm({
                      ...familyForm,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={familyForm.age}
                  onChange={(e) =>
                    setFamilyForm({ ...familyForm, age: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  value={familyForm.occupation}
                  onChange={(e) =>
                    setFamilyForm({ ...familyForm, occupation: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter occupation"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowFamilyModal(false);
                  setFamilyForm({
                    name: "",
                    relationship: "",
                    age: "",
                    occupation: "",
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFamily}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={!familyForm.name || !familyForm.relationship}
              >
                Add Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Important Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Important Date
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={dateForm.title}
                  onChange={(e) =>
                    setDateForm({ ...dateForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Birthday, Anniversary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={dateForm.date}
                  onChange={(e) =>
                    setDateForm({ ...dateForm, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={dateForm.type}
                  onChange={(e) =>
                    setDateForm({
                      ...dateForm,
                      type: e.target.value as
                        | "birthday"
                        | "anniversary"
                        | "other",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDateModal(false);
                  setDateForm({ title: "", date: "", type: "birthday" });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddDate}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={!dateForm.title || !dateForm.date}
              >
                Add Date
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Referral
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={referralForm.name}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={referralForm.phone}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={referralForm.status}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      status: e.target.value as
                        | "contacted"
                        | "converted"
                        | "pending",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReferralModal(false);
                  setReferralForm({
                    name: "",
                    phone: "",
                    status: "pending",
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddReferral}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={!referralForm.name || !referralForm.phone}
              >
                Add Referral
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note *
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={4}
                  placeholder="Enter your note here..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteForm({ content: "" });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={!noteForm.content}
              >
                Add Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-red-50 to-orange-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 ring-4 ring-red-100">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete Customer?
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              {!isDeleting && (
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-2.5 hover:bg-white/60 rounded-xl transition-all hover:scale-110 active:scale-95"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-8 bg-gradient-to-b from-white to-gray-50">
              <p className="text-gray-700 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  {customer.name}
                </span>
                ? This will permanently remove the customer and all associated data.
              </p>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Warning: This action cannot be undone
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-6 py-3 text-gray-700 font-medium hover:bg-white rounded-2xl transition-all disabled:opacity-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-semibold rounded-2xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Customer</span>
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
