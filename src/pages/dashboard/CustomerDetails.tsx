import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Button, Badge, Card } from "../../components/ui";
import toast from "react-hot-toast";

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
  id: number;
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
    | "family"
    | "dates"
    | "referrals"
    | "notes"
    | "ranking"
    | "projects"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);

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

  // Initialize customer data
  useEffect(() => {
    const foundCustomer = mockCustomers.find(
      (c) => c.id === Number(customerId),
    );
    if (foundCustomer) {
      setCustomerData(foundCustomer);
    }
  }, [customerId]);

  const customer = customerData;

  // Handlers
  const handleAddFamily = () => {
    if (!customer || !familyForm.name || !familyForm.relationship) return;

    const updatedCustomer = {
      ...customer,
      familyMembers: [
        ...(customer.familyMembers || []),
        {
          name: familyForm.name,
          relationship: familyForm.relationship,
          age: familyForm.age || undefined,
          occupation: familyForm.occupation || undefined,
        },
      ],
    };
    setCustomerData(updatedCustomer);
    setFamilyForm({ name: "", relationship: "", age: "", occupation: "" });
    setShowFamilyModal(false);
    toast.success("Family member added successfully!");
  };

  const handleAddDate = () => {
    if (!customer || !dateForm.title || !dateForm.date) return;

    const updatedCustomer = {
      ...customer,
      importantDates: [
        ...(customer.importantDates || []),
        {
          title: dateForm.title,
          date: dateForm.date,
          type: dateForm.type,
        },
      ],
    };
    setCustomerData(updatedCustomer);
    setDateForm({ title: "", date: "", type: "birthday" });
    setShowDateModal(false);
    toast.success("Important date added successfully!");
  };

  const handleAddReferral = () => {
    if (!customer || !referralForm.name || !referralForm.phone) return;

    const updatedCustomer = {
      ...customer,
      referrals: [
        ...(customer.referrals || []),
        {
          name: referralForm.name,
          phone: referralForm.phone,
          status: referralForm.status,
          date: referralForm.date,
        },
      ],
    };
    setCustomerData(updatedCustomer);
    setReferralForm({
      name: "",
      phone: "",
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
    setShowReferralModal(false);
    toast.success("Referral added successfully!");
  };

  const handleAddNote = () => {
    if (!customer || !noteForm.content) return;

    const newNote = {
      id: Date.now(),
      content: noteForm.content,
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
    };

    const updatedCustomer = {
      ...customer,
      notes: [...(customer.notes || []), newNote],
    };
    setCustomerData(updatedCustomer);
    setNoteForm({ content: "" });
    setShowNoteModal(false);
    toast.success("Note added successfully!");
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onloadend = () => {
      const updatedCustomer = {
        ...customer,
        photoUrl: reader.result as string,
      };
      setCustomerData(updatedCustomer);
      toast.success("Photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Handle remove photo
  const handleRemovePhoto = () => {
    if (!customer) return;
    const updatedCustomer = {
      ...customer,
      photoUrl: undefined,
    };
    setCustomerData(updatedCustomer);
    toast.success("Photo removed successfully!");
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

    const updatedCustomer = {
      ...customer,
      assignedProjects: [...(customer.assignedProjects || []), projectToAssign],
      projects: (customer.projects || 0) + 1,
    };

    setCustomerData(updatedCustomer);
    setSelectedProjectId("");
    setShowProjectModal(false);
    toast.success(`Project "${projectToAssign.name}" assigned successfully!`);
  };

  // Handle remove project
  const handleRemoveProject = (projectId: string) => {
    if (!customer) return;

    const updatedCustomer = {
      ...customer,
      assignedProjects: customer.assignedProjects?.filter(
        (p) => p.id !== projectId,
      ),
      projects: Math.max((customer.projects || 0) - 1, 0),
    };

    setCustomerData(updatedCustomer);
    toast.success("Project removed from customer");
  };

  // Get available projects (not already assigned)
  const availableProjects = mockProjectsList.filter(
    (p) => !customer?.assignedProjects?.some((ap) => ap.id === p.id),
  );

  // Find customer by ID
  // const customer = mockCustomers.find((c) => c.id === Number(customerId));

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate("/dashboard/customers")}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.name}
            </h1>
            <p className="text-gray-600 mt-1">Customer Details & Information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            className="rounded-xl text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Header Card */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar with Photo Upload */}
          <div className="relative group">
            <div className="relative">
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {customer.initials}
                </div>
              )}
              {/* Upload overlay - always visible on hover with full coverage */}
              <div
                className={`absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  isEditing
                    ? "opacity-0 group-hover:opacity-100"
                    : "opacity-0 group-hover:opacity-95"
                } pointer-events-none group-hover:pointer-events-auto`}
              >
                <button
                  onClick={() => isEditing && fileInputRef.current?.click()}
                  className={`text-white transition-colors z-10 pointer-events-auto ${
                    isEditing
                      ? "hover:text-orange-300 cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                >
                  <Upload className="w-6 h-6" />
                </button>
                <span className="text-white text-xs font-medium z-10">
                  {isEditing ? "Upload" : "Edit to upload"}
                </span>
                {customer.photoUrl && isEditing && (
                  <button
                    onClick={handleRemovePhoto}
                    className="text-white hover:text-red-300 transition-colors mt-1 z-10 pointer-events-auto"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {/* Helper text below avatar */}
            <p className="text-xs text-gray-500 text-center mt-2">
              {isEditing ? "Hover to upload photo" : "Click Edit to add photo"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Customer Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">
                {customer.name}
              </h2>
              <Badge
                className={`${statusColor.bg} ${statusColor.text} rounded-lg`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusColor.dot} mr-2`}
                />
                {customer.status}
              </Badge>
              {rankingColor && (
                <Badge
                  className={`${rankingColor.bg} ${rankingColor.text} rounded-lg`}
                >
                  <span className="mr-1">{rankingColor.icon}</span>
                  {customer.clientRanking}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-orange-500" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-orange-500" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>{customer.location}</span>
              </div>
              {customer.occupation && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  <span>{customer.occupation}</span>
                </div>
              )}
              {customer.companyName && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Award className="w-4 h-4 text-orange-500" />
                  <span>{customer.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Last contact: {customer.lastContact}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(customer.rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {customer.rating} / 5.0
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-orange-600">
                {customer.projects}
              </div>
              <div className="text-sm text-gray-600 mt-1">Projects</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                ₹{(customer.totalValue / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Value</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { key: "overview", label: "Overview", icon: FileText },
          { key: "family", label: "Family", icon: Users },
          { key: "dates", label: "Important Dates", icon: Calendar },
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
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-orange-500 text-orange-600 font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
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
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-500" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium text-gray-900">
                        {customer.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Primary Phone
                      </label>
                      <p className="font-medium text-gray-900">
                        {customer.phone}
                      </p>
                    </div>
                    {customer.alternatePhone && (
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">
                          Alternate Phone
                        </label>
                        <p className="font-medium text-gray-900">
                          {customer.alternatePhone}
                        </p>
                      </div>
                    )}
                    {customer.address && (
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">Address</label>
                        <p className="font-medium text-gray-900">
                          {customer.address}
                        </p>
                      </div>
                    )}
                    {customer.communicationPreference && (
                      <div>
                        <label className="text-sm text-gray-600">
                          Preferred Communication
                        </label>
                        <p className="font-medium text-gray-900 capitalize">
                          {customer.communicationPreference}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Professional Information */}
              {(customer.occupation || customer.companyName) && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-orange-500" />
                    Professional Information
                  </h3>
                  <div className="space-y-3">
                    {customer.occupation && (
                      <div>
                        <label className="text-sm text-gray-600">
                          Occupation
                        </label>
                        <p className="font-medium text-gray-900">
                          {customer.occupation}
                        </p>
                      </div>
                    )}
                    {customer.companyName && (
                      <div>
                        <label className="text-sm text-gray-600">Company</label>
                        <p className="font-medium text-gray-900">
                          {customer.companyName}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === "family" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Family Members
              </h3>
              {customer.familyMembers && customer.familyMembers.length > 0 ? (
                <div className="space-y-4">
                  {customer.familyMembers.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.relationship}
                        </p>
                        {member.occupation && (
                          <p className="text-sm text-gray-500 mt-1">
                            {member.occupation}
                          </p>
                        )}
                      </div>
                      {member.age && (
                        <Badge className="bg-orange-100 text-orange-700">
                          Age: {member.age}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No family members added
                </p>
              )}
              {isEditing && (
                <Button
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowFamilyModal(true)}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Family Member
                </Button>
              )}
            </Card>
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
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                Referrals
              </h3>
              {customer.referrals && customer.referrals.length > 0 ? (
                <div className="space-y-3">
                  {customer.referrals.map((referral, index) => {
                    const statusStyles = {
                      converted: {
                        bg: "bg-green-100",
                        text: "text-green-700",
                        icon: CheckCircle2,
                      },
                      contacted: {
                        bg: "bg-blue-100",
                        text: "text-blue-700",
                        icon: Phone,
                      },
                      pending: {
                        bg: "bg-gray-100",
                        text: "text-gray-700",
                        icon: Clock,
                      },
                    };
                    const style = statusStyles[referral.status];
                    const Icon = style.icon;
                    return (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {referral.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {referral.phone}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Referred on{" "}
                            {new Date(referral.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={`${style.bg} ${style.text} flex items-center gap-1`}
                        >
                          <Icon className="w-3 h-3" />
                          {referral.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No referrals yet
                </p>
              )}
              {isEditing && (
                <Button
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowReferralModal(true)}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Referral
                </Button>
              )}
            </Card>
          )}

          {activeTab === "notes" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-orange-500" />
                Notes
              </h3>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-3">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-900 mb-2">{note.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">{note.createdBy}</span>
                        <span>•</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No notes added</p>
              )}
              {isEditing && (
                <Button
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowNoteModal(true)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Add Note
                </Button>
              )}
            </Card>
          )}

          {/* Ranking Tab */}
          {activeTab === "ranking" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                Client Ranking
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {(["niche", "regular", "one-time", "vip"] as const).map(
                  (rank) => {
                    const isSelected = customer.clientRanking === rank;
                    return (
                      <button
                        key={rank}
                        onClick={() => {
                          if (isEditing) {
                            setCustomerData({
                              ...customer,
                              clientRanking: rank,
                            });
                            toast.success(`Client ranking updated to ${rank}`);
                          }
                        }}
                        disabled={!isEditing}
                        className={`p-6 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-gray-300"
                        } ${!isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              rank === "vip"
                                ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                : rank === "niche"
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                  : rank === "regular"
                                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                    : "bg-gradient-to-br from-gray-500 to-gray-600"
                            }`}
                          >
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900 capitalize">
                              {rank}
                            </p>
                            <p className="text-sm text-gray-500">
                              {rank === "vip"
                                ? "High-value clients"
                                : rank === "niche"
                                  ? "Specialized projects"
                                  : rank === "regular"
                                    ? "Standard clients"
                                    : "Single project"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
              {!isEditing && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Click "Edit" to change client ranking
                </p>
              )}
            </Card>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-orange-500" />
                  Assigned Projects
                </h3>
                {isEditing && (
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => setShowProjectModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Assign Project
                  </Button>
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
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                <Phone className="w-4 h-4" />
                Call Customer
              </Button>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                <Mail className="w-4 h-4" />
                Send Email
              </Button>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Project milestone completed
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Payment received
                  </p>
                  <p className="text-xs text-gray-500 mt-1">5 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Meeting scheduled
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Family Member Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
    </div>
  );
};
