import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
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
  UserPlus,
  Trash2,
  FileText,
  Clock,
  Users,
  FolderOpen,
  Upload,
  X,
  Plus,
  AlertCircle,
  StickyNote,
  Link2,
  Download,
  Image,
  File,
  ExternalLink,
  Home,
  DollarSign,
  Layers,
  Tag,
  Info,
  Shield,
  CreditCard,
  Building2,
  BadgeCheck,
  Pencil,
} from "lucide-react";
import { Button, Badge, Card } from "../../components/ui";
import toast from "react-hot-toast";
import ContactAPI, { type Contact } from "../../services/contactApi";
import LeadAPI, {
  type Lead as LeadOption,
  type LeadNote as LeadApiNote,
} from "../../services/leadApi";
import { fetchAPI } from "../../services/api";
import CustomerAPI, {
  Customer as APICustomer,
  uploadKycDocument,
  saveBankDetailsApi,
  getBankDetails,
  type KycDocType,
  type KycDocument,
  type UpdateImportantDateInput,
} from "../../services/customerApi";
import {
  listAttachments,
  getAttachment,
  deleteAttachment,
  uploadAttachment,
  fileToBase64,
  mimeToAttachmentType,
  type Attachment,
} from "../../services/attachmentApi";
import { useCustomerStore } from "../../stores/customerStore";
import { listProjects } from "../../services/projectApi";
import type { Project } from "../../types";
import {
  IMPORTANT_DATE_TYPE_OPTIONS,
  getImportantDateDisplayTitle,
  getImportantDateTypeLabel,
} from "../../utils/importantDateTypes";

/** YYYY-MM-DD in local timezone (for date input max / validation). */
function formatLocalDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface FamilyMember {
  id?: string;
  firstName?: string;
  lastName?: string;
  relationship: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  notes?: string;
  // legacy compat
  name?: string;
  age?: string;
}

interface ImportantDate {
  id?: string;
  dateType: string;
  date: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
  customLabel?: string;
}

interface Referral {
  name: string;
  phone: string;
  status: "contacted" | "converted" | "pending";
  date: string;
}

interface Note {
  id: number | string;
  content: string;
  createdBy: string;
  createdAt: string;
}

const mapLeadNotesToCustomerNotes = (leadNotes: LeadApiNote[]): Note[] =>
  leadNotes
    .filter((note) => Boolean(note?.content?.trim()))
    .map((note) => ({
      id: note.id || `lead-note-${Math.random().toString(36).slice(2)}`,
      content: note.content,
      createdBy: note.createdByName || note.createdBy || "Lead Activity",
      createdAt: note.createdAt || new Date().toISOString(),
    }));

const mergeCustomerNotes = (
  customerNotes: Note[],
  leadNotes: Note[],
): Note[] => {
  const merged = [...customerNotes, ...leadNotes];

  // Avoid duplicate rows when backend stores the same text in customer and lead timelines.
  const deduped = merged.filter((note, idx, arr) => {
    const normalizedContent = note.content.trim().toLowerCase();
    const normalizedDate = note.createdAt ? note.createdAt.slice(0, 16) : "";
    return (
      arr.findIndex((candidate) => {
        const candidateContent = candidate.content.trim().toLowerCase();
        const candidateDate = candidate.createdAt
          ? candidate.createdAt.slice(0, 16)
          : "";
        return (
          candidateContent === normalizedContent &&
          candidateDate === normalizedDate
        );
      }) === idx
    );
  });

  return deduped.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );
};

interface AssignedProject {
  id: string;
  name: string;
  status: "active" | "on_hold" | "completed";
  progress: number;
}

interface Customer {
  id: string | number;
  customerNumber?: string;
  name: string;
  initials: string;
  bankDetails?: string;
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
  secondaryEmails?: string[];
  secondaryPhones?: string[];
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
  convertedFromLead?: APICustomer["convertedFromLead"] | null;
  /** Merged top-level + uiIntake fields from “Add customer” / API */
  customerIntake?: CustomerIntakeSnapshot;
}

/** Intake fields from Add Customer modal — merged from API root + uiIntake */
type CustomerIntakeSnapshot = Partial<{
  companyName: string;
  propertyType: string;
  projectType: string;
  area: string;
  city: string;
  projectStage: string;
  startTimeline: string;
  budgetComfort: string;
  projectScope: string;
  floorPlan: string;
  floorPlanUrl: string;
  messageNotes: string;
  requirements: string;
}>;

/** Matches PUT /api/customers/:id project-related body fields */
type IntakeEditFormState = {
  propertyType: string;
  projectType: string;
  area: string;
  city: string;
  startTimeline: string;
  budgetComfort: string;
  projectScope: string;
  requirements: string;
  floorPlanUrl: string;
};

function pickStringField(
  top: unknown,
  nested: unknown,
): string | undefined {
  const a =
    typeof top === "string" && top.trim()
      ? top.trim()
      : typeof nested === "string" && nested.trim()
        ? nested.trim()
        : undefined;
  return a;
}

function pickAreaField(top: unknown, nested: unknown): string | undefined {
  const v = top !== undefined && top !== null && top !== "" ? top : nested;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function mergeCustomerIntakeFromApi(
  api: Record<string, unknown>,
): CustomerIntakeSnapshot {
  const uiRaw = api.uiIntake;
  const ui =
    uiRaw && typeof uiRaw === "object" && uiRaw !== null
      ? (uiRaw as Record<string, unknown>)
      : {};
  const out: CustomerIntakeSnapshot = {};

  const areaVal = pickAreaField(api.area, ui.area);
  if (areaVal) out.area = areaVal;

  const stringKeys = [
    "companyName",
    "propertyType",
    "projectType",
    "city",
    "projectStage",
    "startTimeline",
    "budgetComfort",
    "projectScope",
    "floorPlan",
    "messageNotes",
    "requirements",
  ] as const;
  for (const k of stringKeys) {
    const pick = pickStringField(api[k], ui[k]);
    if (pick) out[k] = pick;
  }

  const floorPlanUrl =
    pickStringField(api.floorPlanUrl, ui.floorPlanUrl) ||
    pickStringField(api.floor_plan_url, undefined);
  if (floorPlanUrl) out.floorPlanUrl = floorPlanUrl;

  return out;
}

function buildIntakeEditFormFromCustomer(c: Customer): IntakeEditFormState {
  const i = c.customerIntake || {};
  return {
    propertyType: i.propertyType || "",
    projectType: i.projectType || "",
    area: i.area || "",
    city: i.city || "",
    startTimeline: i.startTimeline || "",
    budgetComfort: i.budgetComfort || "",
    projectScope: i.projectScope || "",
    requirements: i.requirements || "",
    floorPlanUrl: i.floorPlanUrl || i.floorPlan || "",
  };
}

/** View keys for this card — same set sent on save (PUT customer) */
const PUT_PROJECT_INTAKE_KEYS: (keyof CustomerIntakeSnapshot)[] = [
  "propertyType",
  "projectType",
  "area",
  "city",
  "startTimeline",
  "budgetComfort",
  "projectScope",
  "requirements",
  "floorPlanUrl",
  "floorPlan",
];

function formatCustomerIntakeLabel(key: string): string {
  const labels: Record<string, string> = {
    companyName: "Company name",
    occupation: "Occupation",
    propertyType: "Property type",
    projectType: "Project type",
    area: "Area (sq.ft / size)",
    city: "City",
    projectStage: "Project stage",
    startTimeline: "Start timeline",
    budgetComfort: "Budget comfort",
    projectScope: "Project scope",
    floorPlan: "Floor plan",
    floorPlanUrl: "Floor plan URL",
    messageNotes: "Notes",
    requirements: "Requirements",
  };
  return labels[key] || key;
}

function formatCustomerIntakeDisplayValue(key: string, value: string): string {
  const enumish = new Set([
    "propertyType",
    "projectType",
    "projectStage",
    "budgetComfort",
    "projectScope",
    "startTimeline",
  ]);
  if (!enumish.has(key)) return value;
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Dropdown options aligned with POST/PUT customer APIs */
const INTAKE_PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "VILLA", label: "Villa" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "OTHERS", label: "Others" },
];

const INTAKE_PROJECT_TYPE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "ROW_HOUSE", label: "Row House" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "STUDIO", label: "Studio" },
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL", label: "Retail" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "OTHER", label: "Other" },
];

const INTAKE_START_TIMELINE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "IMMEDIATELY", label: "Immediately" },
  { value: "WITHIN_MONTH", label: "Within a month" },
  { value: "ONE_TO_THREE_MONTHS", label: "1-3 Months" },
  { value: "THREE_TO_SIX_MONTHS", label: "3-6 Months" },
  { value: "SIX_PLUS_MONTHS", label: "6+ Months" },
];

const INTAKE_BUDGET_COMFORT_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "VALUE", label: "Value" },
  { value: "BALANCED", label: "Balanced" },
  { value: "PREMIUM", label: "Premium" },
  { value: "LUXURY", label: "Luxury" },
  { value: "NEED_GUIDANCE", label: "Need Guidance" },
];

const INTAKE_PROJECT_SCOPE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "TURNKEY", label: "Turnkey" },
  { value: "DESIGN_ONLY", label: "Design Only" },
  { value: "KITCHEN_WARDROBES", label: "Kitchen & Wardrobes" },
  { value: "INTERIOR_DESIGN_ONLY", label: "Interior Design Only" },
  {
    value: "INTERIOR_DESIGN_AND_BUILD",
    label: "Interior Design & Build",
  },
  {
    value: "ARCHITECTURE_DESIGN_ONLY",
    label: "Architecture Design Only",
  },
  { value: "RENOVATION", label: "Renovation" },
  { value: "SPECIFIC_SPACE", label: "Specific Space" },
  { value: "FULL_HOME_INTERIOR", label: "Full home interior" },
  { value: "OTHERS", label: "Others" },
];

function mergeIntakeSelectOptions(
  options: { value: string; label: string }[],
  current: string,
): { value: string; label: string }[] {
  const v = (current || "").trim();
  if (!v || options.some((o) => o.value === v)) return options;
  return [...options, { value: v, label: v }];
}

const statusColors = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};

const toCurrencyNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatCurrencyINR = (value: unknown): string => {
  const amount = toCurrencyNumber(value);
  return `₹${amount.toLocaleString("en-IN")}`;
};

const LEAD_REFERENCE_RENDERED_KEYS = new Set([
  "id",
  "name",
  "email",
  "phone",
  "source",
  "assignedToId",
  "status",
  "stage",
  "score",
  "priority",
  "createdAt",
  "updatedAt",
  "message",
  "requirements",
  "notes",
  "projectType",
  "propertyProjectType",
  "propertyType",
  "homeType",
  "bhkConfig",
  "carpetArea",
  "area",
  "city",
  "locality",
  "location",
  "projectStage",
  "projectScope",
  "scopeOfWork",
  "servicesInterested",
  "budget",
  "budgetRange",
  "budgetComfort",
  "timeline",
  "startTimeline",
  "expectedStartDate",
  "moveinDate",
  "serviceInterest",
  "designStyle",
  "colorPreferences",
  "referrerName",
  "referrerPhone",
  "referrerProjectNumber",
  "agentAgencyName",
  "agentAgencyDetails",
  "contacts",
  "stageHistory",
  "activities",
  "convertedToAccount",
  "inspirationImages",
  "references",
]);

const isLeadReferenceMeaningful = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

const formatLeadReferenceLabel = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatLeadReferenceValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const v = item as Record<string, unknown>;
          return (
            (v.name as string) ||
            (v.title as string) ||
            (v.label as string) ||
            JSON.stringify(item)
          );
        }
        return String(item);
      })
      .join(", ");
  }

  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    // Handle specific object shapes like { name, email, id }
    if (v.name && typeof v.name === "string") {
      return v.name;
    }
    if (v.title && typeof v.title === "string") {
      return v.title;
    }
    if (v.label && typeof v.label === "string") {
      return v.label;
    }

    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

const isHttpUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value.trim());

const getFileNameFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const rawFileName = pathSegments[pathSegments.length - 1];

    if (rawFileName) {
      return decodeURIComponent(rawFileName);
    }
  } catch {
    // Fall back to a generic label for malformed URLs.
  }

  return "Open file";
};

const getAdditionalLeadReferenceFields = (
  lead: LeadOption | null,
): Array<{ key: string; value: unknown }> => {
  if (!lead) return [];

  return Object.entries(lead)
    .filter(
      ([key, value]) =>
        !LEAD_REFERENCE_RENDERED_KEYS.has(key) &&
        isLeadReferenceMeaningful(value),
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
};

type LeadReferenceEditForm = {
  source: string;
  status: string;
  stage: string;
  score: string;
  priority: string;
  message: string;
  projectType: string;
  propertyProjectType: string;
  propertyType: string;
  homeType: string;
  bhkConfig: string;
  area: string;
  carpetArea: string;
  city: string;
  locality: string;
  location: string;
  projectStage: string;
  projectScope: string;
  budget: string;
  budgetRange: string;
  budgetComfort: string;
  timeline: string;
  startTimeline: string;
  expectedStartDate: string;
  moveinDate: string;
  companyName: string;
  householdOrCompany: string;
  canWhatsApp: boolean;
  wantsExperienceCenterVisit: boolean;
  isPhoneVerified: boolean;
  verificationAttempts: string;
  budgetTier: string;
};

type LeadReferenceEditableField = keyof LeadReferenceEditForm;

type SelectOption = {
  value: string;
  label: string;
};

const DEFAULT_LEAD_SOURCE_OPTIONS: SelectOption[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PHONE", label: "Phone" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "REFERRAL", label: "Referral" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "EXHIBITION", label: "Exhibition" },
  { value: "EXPO", label: "Expo" },
  { value: "PAID_LEAD", label: "Paid Lead" },
  { value: "CONTACT_FORM", label: "Contact Form" },
  { value: "OTHER", label: "Other" },
];

const DEFAULT_LEAD_STATUS_OPTIONS: SelectOption[] = [
  { value: "NEW", label: "New" },
  { value: "WORKING", label: "Working" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "DISQUALIFIED", label: "Disqualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED", label: "Converted" },
];

const LEAD_STAGE_OPTIONS: SelectOption[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "WORKING", label: "Working" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "DISQUALIFIED", label: "Disqualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
];

const LEAD_FIELD_ENUM_OPTIONS: Partial<
  Record<LeadReferenceEditableField, SelectOption[]>
> = {
  propertyType: [
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "MIXED_USE", label: "Mixed Use" },
    { value: "OTHERS", label: "Others" },
  ],
  projectType: [
    { value: "APARTMENT", label: "Apartment" },
    { value: "VILLA", label: "Villa" },
    { value: "ROW_HOUSE", label: "Row House" },
    { value: "PENTHOUSE", label: "Penthouse" },
    { value: "DUPLEX", label: "Duplex" },
    { value: "STUDIO", label: "Studio" },
    { value: "OFFICE", label: "Office" },
    { value: "RETAIL", label: "Retail" },
    { value: "WAREHOUSE", label: "Warehouse" },
    { value: "OTHER", label: "Other" },
  ],
  homeType: [
    { value: "NOT_SURE", label: "Not Sure" },
    { value: "ONE_BHK", label: "1 BHK" },
    { value: "TWO_BHK", label: "2 BHK" },
    { value: "THREE_BHK", label: "3 BHK" },
    { value: "FOUR_BHK", label: "4 BHK" },
    { value: "VILLA_ROW_HOUSE", label: "Villa / Row House" },
    { value: "DUPLEX", label: "Duplex" },
    { value: "TRIPLEX", label: "Triplex" },
    { value: "PENTHOUSE", label: "Penthouse" },
    { value: "OTHERS", label: "Others" },
  ],
  propertyProjectType: [
    { value: "HIGHRISE", label: "High Rise" },
    { value: "LOWRISE", label: "Low Rise" },
    { value: "GATED_COMMUNITY", label: "Gated Community" },
    { value: "VILLA", label: "Villa" },
    { value: "TOWNHOUSE", label: "Townhouse" },
    { value: "PLOTTED", label: "Plotted" },
    { value: "OTHERS", label: "Others" },
  ],
  projectStage: [
    { value: "NOT_SURE", label: "Not Sure" },
    { value: "NEW_HOME_PENDING", label: "New Home - Pending Possession" },
    { value: "NEW_HOME_RECEIVED", label: "New Home - Received" },
    { value: "RENOVATION", label: "Renovation" },
    { value: "COMMERCIAL_FITOUT", label: "Commercial Fitout" },
  ],
  startTimeline: [
    { value: "NOT_SURE", label: "Not Sure" },
    { value: "IMMEDIATELY", label: "Immediately" },
    { value: "ONE_TO_THREE_MONTHS", label: "1-3 Months" },
    { value: "THREE_TO_SIX_MONTHS", label: "3-6 Months" },
    { value: "SIX_PLUS_MONTHS", label: "6+ Months" },
  ],
  budgetComfort: [
    { value: "NOT_SURE", label: "Not Sure" },
    { value: "VALUE", label: "Value" },
    { value: "BALANCED", label: "Balanced" },
    { value: "PREMIUM", label: "Premium" },
    { value: "NEED_GUIDANCE", label: "Need Guidance" },
  ],
  projectScope: [
    { value: "NOT_SURE", label: "Not Sure" },
    { value: "TURNKEY", label: "Turnkey" },
    { value: "DESIGN_ONLY", label: "Design Only" },
    { value: "KITCHEN_WARDROBES", label: "Kitchen & Wardrobes" },
    { value: "INTERIOR_DESIGN_ONLY", label: "Interior Design Only" },
    { value: "INTERIOR_DESIGN_AND_BUILD", label: "Interior Design & Build" },
    { value: "ARCHITECTURE_DESIGN_ONLY", label: "Architecture Design Only" },
    { value: "RENOVATION", label: "Renovation" },
    { value: "SPECIFIC_SPACE", label: "Specific Space" },
    { value: "OTHERS", label: "Others" },
  ],
  householdOrCompany: [
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "OTHERS", label: "Others" },
  ],
  budgetTier: [
    { value: "STANDARD", label: "Standard" },
    { value: "LUXURY", label: "Luxury" },
  ],
};

const LEAD_REFERENCE_EDIT_SOURCE_MAP: Record<
  LeadReferenceEditableField,
  string[]
> = {
  source: ["source"],
  status: ["status"],
  stage: ["stage"],
  score: ["score"],
  priority: ["priority"],
  message: ["message", "requirements", "notes"],
  projectType: ["projectType"],
  propertyProjectType: ["propertyProjectType"],
  propertyType: ["propertyType"],
  homeType: ["homeType"],
  bhkConfig: ["bhkConfig"],
  area: ["area"],
  carpetArea: ["carpetArea"],
  city: ["city"],
  locality: ["locality"],
  location: ["location"],
  projectStage: ["projectStage"],
  projectScope: ["projectScope"],
  budget: ["budget"],
  budgetRange: ["budgetRange"],
  budgetComfort: ["budgetComfort"],
  timeline: ["timeline"],
  startTimeline: ["startTimeline"],
  expectedStartDate: ["expectedStartDate"],
  moveinDate: ["moveinDate"],
  companyName: ["companyName"],
  householdOrCompany: ["householdOrCompany"],
  canWhatsApp: ["canWhatsApp"],
  wantsExperienceCenterVisit: ["wantsExperienceCenterVisit"],
  isPhoneVerified: ["isPhoneVerified"],
  verificationAttempts: ["verificationAttempts"],
  budgetTier: ["budgetTier"],
};

const getEditableLeadReferenceFieldSet = (
  lead: LeadOption | null,
): Set<LeadReferenceEditableField> => {
  const editableFields = new Set<LeadReferenceEditableField>();
  if (!lead) return editableFields;

  (
    Object.keys(LEAD_REFERENCE_EDIT_SOURCE_MAP) as LeadReferenceEditableField[]
  ).forEach((field) => {
    const sourceKeys = LEAD_REFERENCE_EDIT_SOURCE_MAP[field];
    const hasValue = sourceKeys.some((key) =>
      isLeadReferenceMeaningful(
        (lead as unknown as Record<string, unknown>)[key],
      ),
    );

    if (hasValue) {
      editableFields.add(field);
    }
  });

  return editableFields;
};

const toTextInputValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toISOString().slice(0, 10);
};

const parseOptionalNumber = (
  value: string,
  label: string,
): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number`);
  }
  return parsed;
};

const createLeadReferenceEditForm = (
  lead: LeadOption | null,
): LeadReferenceEditForm => ({
  source: toTextInputValue(lead?.source),
  status: toTextInputValue(lead?.status),
  stage: toTextInputValue(lead?.stage),
  score: toTextInputValue(lead?.score),
  priority: toTextInputValue(lead?.priority),
  message: toTextInputValue(lead?.message || lead?.requirements || lead?.notes),
  projectType: toTextInputValue(lead?.projectType),
  propertyProjectType: toTextInputValue(lead?.propertyProjectType),
  propertyType: toTextInputValue(lead?.propertyType),
  homeType: toTextInputValue(lead?.homeType),
  bhkConfig: toTextInputValue(lead?.bhkConfig),
  area: toTextInputValue(lead?.area),
  carpetArea: toTextInputValue(lead?.carpetArea),
  city: toTextInputValue(lead?.city),
  locality: toTextInputValue(lead?.locality),
  location: toTextInputValue(lead?.location),
  projectStage: toTextInputValue(lead?.projectStage),
  projectScope: toTextInputValue(lead?.projectScope),
  budget: toTextInputValue(lead?.budget),
  budgetRange: toTextInputValue(lead?.budgetRange),
  budgetComfort: toTextInputValue(lead?.budgetComfort),
  timeline: toTextInputValue(lead?.timeline),
  startTimeline: toTextInputValue(lead?.startTimeline),
  expectedStartDate: toDateInputValue(lead?.expectedStartDate),
  moveinDate: toDateInputValue(lead?.moveinDate),
  companyName: toTextInputValue(lead?.companyName),
  householdOrCompany: toTextInputValue(lead?.householdOrCompany),
  canWhatsApp: Boolean(lead?.canWhatsApp),
  wantsExperienceCenterVisit: Boolean(lead?.wantsExperienceCenterVisit),
  isPhoneVerified: Boolean(lead?.isPhoneVerified),
  verificationAttempts: toTextInputValue(lead?.verificationAttempts),
  budgetTier: toTextInputValue(lead?.budgetTier),
});

const rankingColors = {
  vip: { bg: "bg-purple-100", text: "text-purple-700", icon: "👑" },
  niche: { bg: "bg-orange-100", text: "text-orange-700", icon: "⭐" },
  regular: { bg: "bg-blue-100", text: "text-blue-700", icon: "👤" },
  "one-time": { bg: "bg-gray-100", text: "text-gray-700", icon: "📋" },
};

export const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { setCurrentCustomer } = useCustomerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "family"
    | "dates"
    | "referrals"
    | "notes"
    | "ranking"
    | "projects"
    | "references"
    | "kyc"
  >("overview");
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const isEditing = editingTab !== null;
  const [isSaving, setIsSaving] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{
    message: string;
    field?: "email" | "phone" | "status";
  } | null>(null);

  // Contact info edit state
  const [contactEditForm, setContactEditForm] = useState<{
    email: string;
    phone: string;
    secondaryEmails: string[];
    secondaryPhones: string[];
    newEmail: string;
    newPhone: string;
  }>({
    email: "",
    phone: "",
    secondaryEmails: [],
    secondaryPhones: [],
    newEmail: "",
    newPhone: "",
  });

  const [editingProjectIntake, setEditingProjectIntake] = useState(false);
  const [intakeEditForm, setIntakeEditForm] = useState<IntakeEditFormState>({
    propertyType: "",
    projectType: "",
    area: "",
    city: "",
    startTimeline: "",
    budgetComfort: "",
    projectScope: "",
    requirements: "",
    floorPlanUrl: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contacts state
  const [, setContacts] = useState<Contact[]>([]);

  // API referrals state
  const [apiReferrals, setApiReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Modal states
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [editingImportantDate, setEditingImportantDate] =
    useState<ImportantDate | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form states
  const [familyForm, setFamilyForm] = useState({
    firstName: "",
    lastName: "",
    relationship: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    occupation: "",
    notes: "",
  });
  const [relationshipTypes, setRelationshipTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [dateForm, setDateForm] = useState({
    dateType: "BIRTHDAY",
    date: "",
    isRecurring: true,
    reminderDays: 7,
    notes: "",
    customLabel: "",
  });
  const [referralForm, setReferralForm] = useState({ leadId: "" });
  const [allLeads, setAllLeads] = useState<LeadOption[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [noteForm, setNoteForm] = useState({
    content: "",
  });

  // Local customer data (in production, this would sync with backend)
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Customer projects state
  const [customerProjects, setCustomerProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Lead References state (for converted leads)
  const [leadReferenceData, setLeadReferenceData] = useState<LeadOption | null>(
    null,
  );
  const [leadSourceOptions, setLeadSourceOptions] = useState<SelectOption[]>(
    DEFAULT_LEAD_SOURCE_OPTIONS,
  );
  const [leadStatusOptions, setLeadStatusOptions] = useState<SelectOption[]>(
    DEFAULT_LEAD_STATUS_OPTIONS,
  );
  const [leadReferenceEditing, setLeadReferenceEditing] = useState(false);
  const [leadReferenceSaving, setLeadReferenceSaving] = useState(false);
  const [leadReferenceEditForm, setLeadReferenceEditForm] =
    useState<LeadReferenceEditForm>(createLeadReferenceEditForm(null));
  const [leadAttachments, setLeadAttachments] = useState<Attachment[]>([]);
  const [loadingLeadReferences, setLoadingLeadReferences] = useState(false);
  const leadReferenceUploadInputRef = useRef<HTMLInputElement>(null);
  const [referenceUploadTitle, setReferenceUploadTitle] = useState("");
  const [referenceUploadFile, setReferenceUploadFile] = useState<File | null>(
    null,
  );
  const [uploadingReference, setUploadingReference] = useState(false);
  // Tracks which attachment is currently being fetched: { id, action }
  const [attachmentLoading, setAttachmentLoading] = useState<{
    id: string;
    action: "view" | "download";
  } | null>(null);

  // KYC state
  const kycFileInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedKyc = useRef(false);
  const [kycUploadTarget, setKycUploadTarget] = useState<string | null>(null);
  const [kycAttachments, setKycAttachments] = useState<KycDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const [kycDeleting, setKycDeleting] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState("");
  const [bankDetailsEditing, setBankDetailsEditing] = useState(false);
  const [bankDetailsSaving, setBankDetailsSaving] = useState(false);

  // Profile edit state (name, type, status)
  const [profileEditForm, setProfileEditForm] = useState<{
    name: string;
    type: string;
    status: string;
  }>({ name: "", type: "", status: "" });
  const [customerTypes, setCustomerTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [customerStatuses, setCustomerStatuses] = useState<
    { value: string; label: string }[]
  >([]);

  const KYC_DOCS = [
    {
      key: "AADHAR",
      label: "Aadhar Card",
      description: "12-digit government issued identity",
      required: true,
      icon: BadgeCheck,
      color: "blue",
    },
    {
      key: "PAN",
      label: "PAN Card",
      description: "Permanent Account Number card",
      required: true,
      icon: CreditCard,
      color: "orange",
    },
    {
      key: "GST_CERTIFICATE",
      label: "GST Certificate",
      description: "Goods & Services Tax registration",
      required: false,
      icon: Shield,
      color: "green",
    },
  ] as const;

  /**
   * Fetch a fresh signed downloadUrl from GET /api/attachments/:id
   * then open or download the file.
   */
  const handleAttachmentAction = async (
    attachment: Attachment,
    action: "view" | "download",
  ) => {
    if (attachmentLoading?.id === attachment.id) return; // already in-flight
    setAttachmentLoading({ id: attachment.id, action });
    try {
      const fresh = await getAttachment(attachment.id);
      const url = fresh.downloadUrl || fresh.fileUrl || fresh.storageUrl || "";
      if (!url) {
        toast.error("File URL not available");
        return;
      }
      if (action === "view") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        // Trigger download via a temporary anchor
        const a = document.createElement("a");
        a.href = url;
        a.download = fresh.fileName || attachment.fileName;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Failed to fetch attachment URL:", err);
      toast.error("Failed to load file. Please try again.");
    } finally {
      setAttachmentLoading(null);
    }
  };

  const getUploadFileName = (file: File, title: string): string => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return file.name;

    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop()}`
      : "";
    return `${cleanTitle}${extension}`;
  };

  const handleUploadLeadReference = async () => {
    if (uploadingReference) return;
    const leadId = customerData?.leadId;

    if (!leadId) {
      toast.error("Lead reference is not available for this customer");
      return;
    }

    if (!referenceUploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploadingReference(true);
    try {
      const fileBase64 = await fileToBase64(referenceUploadFile);
      const fileName = getUploadFileName(
        referenceUploadFile,
        referenceUploadTitle,
      );

      const uploadedAttachment = await uploadAttachment({
        entityType: "LEAD",
        entityId: leadId,
        attachmentType: mimeToAttachmentType(referenceUploadFile.type),
        fileName,
        fileType: referenceUploadFile.type || "application/octet-stream",
        fileBase64,
        notes: referenceUploadTitle.trim() || "Customer reference upload",
      });

      // Fetch the freshly uploaded attachment by id as required by API flow.
      const freshAttachment = await getAttachment(uploadedAttachment.id);
      const normalizedAttachment = {
        ...uploadedAttachment,
        ...freshAttachment,
      } as Attachment;

      setLeadAttachments((prev) => {
        const deduped = prev.filter((a) => a.id !== normalizedAttachment.id);
        return [normalizedAttachment, ...deduped];
      });

      setReferenceUploadTitle("");
      setReferenceUploadFile(null);
      if (leadReferenceUploadInputRef.current) {
        leadReferenceUploadInputRef.current.value = "";
      }

      toast.success("Reference uploaded successfully");
    } catch (err) {
      console.error("Failed to upload reference:", err);
      toast.error("Failed to upload reference");
    } finally {
      setUploadingReference(false);
    }
  };

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
        const primaryContact =
          apiContacts.find((c) => c.isPrimary) || apiContacts[0];
        const customerEmail =
          apiCustomer.email ||
          primaryContact?.email ||
          apiCustomer.convertedFromLead?.email ||
          "";
        const customerPhone =
          apiCustomer.phone ||
          primaryContact?.phone ||
          apiCustomer.convertedFromLead?.phone ||
          "";

        // Map family members from API
        const apiFamilyMembers: FamilyMember[] = (
          apiCustomer.familyMembers || []
        ).map((fm: any) => ({
          id: fm.id || undefined,
          firstName: fm.firstName || fm.name?.split(" ")[0] || "",
          lastName:
            fm.lastName || fm.name?.split(" ").slice(1).join(" ") || undefined,
          name:
            fm.name ||
            [fm.firstName, fm.lastName].filter(Boolean).join(" ") ||
            "",
          relationship: fm.relationship || "",
          dateOfBirth: fm.dateOfBirth || undefined,
          phone: fm.phone || undefined,
          email: fm.email || undefined,
          occupation: fm.occupation || undefined,
          notes: fm.notes || undefined,
          age: fm.age || undefined,
        }));

        // Map important dates from API
        const apiImportantDates: ImportantDate[] = (
          apiCustomer.importantDates || []
        ).map((d: any) => ({
          id: d.id,
          dateType: (d.dateType || d.type || "CUSTOM").toUpperCase(),
          date: d.date || "",
          isRecurring: d.isRecurring,
          reminderDays: d.reminderDays,
          notes: d.notes || d.title || "",
          customLabel: d.customLabel ?? undefined,
        }));

        // Map projects from API
        const apiProjects: AssignedProject[] = (apiCustomer.projects || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name || "Unnamed Project",
            status:
              (p.status?.toLowerCase() as "active" | "on_hold" | "completed") ||
              "active",
            progress: p.progress || 0,
          }),
        );
        const embeddedProjectTotalValue = (apiCustomer.projects || []).reduce(
          (sum: number, project: any) =>
            sum + toCurrencyNumber(project?.totalValue),
          0,
        );

        console.log("Raw API projects:", apiCustomer.projects);
        console.log("Mapped projects:", apiProjects);
        console.log("Projects count:", apiCustomer._count?.projects);

        const rawApiRecord = apiCustomer as unknown as Record<string, unknown>;
        const intakeMerged = mergeCustomerIntakeFromApi(rawApiRecord);
        const occupationFromApi =
          typeof rawApiRecord.occupation === "string"
            ? rawApiRecord.occupation.trim()
            : "";

        // Build location from billing/shipping, or fall back to intake city/area from Add Customer
        const locationParts = [
          apiCustomer.billingCity ||
            apiCustomer.shippingCity ||
            intakeMerged.city,
          apiCustomer.billingState || apiCustomer.shippingState,
        ].filter(Boolean);
        const location =
          locationParts.length > 0
            ? locationParts.join(", ")
            : intakeMerged.city || intakeMerged.area
              ? [intakeMerged.city, intakeMerged.area].filter(Boolean).join(" — ")
              : apiCustomer.billingAddress ||
                apiCustomer.shippingAddress ||
                "N/A";

        // Conversion responses can vary by backend version.
        // Resolve the original lead id from all known payload shapes.
        const resolvedLeadId =
          apiCustomer.convertedFromLeadId ||
          apiCustomer.convertedFromLead?.id ||
          (apiCustomer as any).leadId ||
          (apiCustomer as any).lead?.id ||
          undefined;

        const baseCustomerNotes: Note[] = apiCustomer.notes
          ? [
              {
                id: 1,
                content: apiCustomer.notes,
                createdBy: "System",
                createdAt: apiCustomer.createdAt || "",
              },
            ]
          : [];

        let leadNotes: Note[] = [];
        if (resolvedLeadId) {
          try {
            const apiLeadNotes = await LeadAPI.getLeadNotes(resolvedLeadId);
            leadNotes = mapLeadNotesToCustomerNotes(apiLeadNotes || []);
          } catch (leadNotesError) {
            console.warn(
              "Failed to fetch converted lead notes:",
              leadNotesError,
            );
          }
        }

        const mergedNotes = mergeCustomerNotes(baseCustomerNotes, leadNotes);

        const mappedCustomer: Customer = {
          id: apiCustomer.id, // Keep UUID as string
          customerNumber: apiCustomer.customerNumber || undefined,
          name: customerName,
          initials,
          bankDetails: apiCustomer.bankDetails || "",
          email: customerEmail,
          phone: customerPhone,
          location,
          projects: apiCustomer._count?.projects || apiProjects.length || 0,
          totalValue: embeddedProjectTotalValue,
          status:
            (apiCustomer.status?.toLowerCase() as
              | "active"
              | "completed"
              | "inactive") || "active",
          rating: 0,
          lastContact: apiCustomer.updatedAt
            ? new Date(apiCustomer.updatedAt).toLocaleDateString()
            : "N/A",
          photoUrl: undefined,
          alternatePhone: undefined,
          secondaryEmails: (apiCustomer as any).secondaryEmails || [],
          secondaryPhones: (apiCustomer as any).secondaryPhones || [],
          address:
            apiCustomer.billingAddress ||
            apiCustomer.shippingAddress ||
            undefined,
          familyMembers: apiFamilyMembers,
          importantDates: apiImportantDates,
          referrals: [],
          clientRanking: undefined,
          communicationPreference: undefined,
          notes: mergedNotes,
          occupation: occupationFromApi || undefined,
          companyName: intakeMerged.companyName || undefined,
          customerIntake:
            Object.keys(intakeMerged).length > 0 ? intakeMerged : undefined,
          assignedProjects: apiProjects,
          leadId: resolvedLeadId,
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
          contactsCount:
            apiCustomer._count?.contacts || apiContacts.length || 0,
          projectsCount:
            apiCustomer._count?.projects || apiProjects.length || 0,
          createdAt: apiCustomer.createdAt,
          updatedAt: apiCustomer.updatedAt,
          convertedFromLead: apiCustomer.convertedFromLead || null,
        };

        setCustomerData(mappedCustomer);
        setBankDetails(apiCustomer.bankDetails || "");
        setCurrentCustomer({
          id: mappedCustomer.id as string,
          name: mappedCustomer.name,
        });
        console.log("Customer data mapped successfully:", mappedCustomer);
        console.log(
          "Assigned projects in customer:",
          mappedCustomer.assignedProjects,
        );
      } catch (error) {
        console.error("Failed to fetch customer. Error details:", error);
        console.error("Customer ID attempted:", customerId);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
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
  }, [customerId, navigate, setCurrentCustomer]);

  // Reset lead reference data whenever the customer changes so stale
  // files from a previous customer are never shown.
  useEffect(() => {
    setLeadReferenceData(null);
    setLeadAttachments([]);
    setLeadReferenceEditing(false);
    setLeadReferenceEditForm(createLeadReferenceEditForm(null));
  }, [customerId]);

  // Load relationship types once on mount
  useEffect(() => {
    CustomerAPI.getFamilyRelationshipTypes().then(setRelationshipTypes);
  }, []);

  // Load lead source/status options for dropdown-driven editing.
  useEffect(() => {
    const fetchLeadOptions = async () => {
      try {
        const [sources, statuses] = await Promise.all([
          LeadAPI.getLeadSources(),
          LeadAPI.getLeadStatuses(),
        ]);

        if (Array.isArray(sources) && sources.length > 0) {
          setLeadSourceOptions(
            sources.map((item) => ({ value: item.value, label: item.label })),
          );
        }

        if (Array.isArray(statuses) && statuses.length > 0) {
          setLeadStatusOptions(
            statuses.map((item) => ({ value: item.value, label: item.label })),
          );
        }
      } catch (error) {
        console.warn("Failed to load lead dropdown options:", error);
      }
    };

    fetchLeadOptions();
  }, []);

  // Load customer types and statuses once on mount
  useEffect(() => {
    CustomerAPI.getCustomerTypes()
      .then(setCustomerTypes)
      .catch(() =>
        setCustomerTypes([
          { value: "RESIDENTIAL", label: "Residential" },
          { value: "COMMERCIAL", label: "Commercial" },
        ]),
      );
    CustomerAPI.getCustomerStatuses()
      .then(setCustomerStatuses)
      .catch(() =>
        setCustomerStatuses([
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "COMPLETED", label: "Completed" },
        ]),
      );
  }, []);

  // Clear current customer from store when leaving the page
  useEffect(() => {
    return () => {
      setCurrentCustomer(null);
    };
  }, [setCurrentCustomer]);

  // Fetch referrals from API
  const fetchReferrals = useCallback(async () => {
    if (!customerId) return;
    setLoadingReferrals(true);
    try {
      const data = await fetchAPI<any>(
        `/api/referrals/customer/${customerId}/leads`,
        { method: "GET" },
      );
      // Handle { referredLeads: [...] } shape from API
      const list = Array.isArray(data)
        ? data
        : data?.referredLeads ||
          data?.referrals ||
          data?.leads ||
          data?.data ||
          [];
      setApiReferrals(list);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoadingReferrals(false);
    }
  }, [customerId]);

  // Fetch referrals when the referrals tab is active
  useEffect(() => {
    if (activeTab === "referrals") {
      fetchReferrals();
    }
  }, [activeTab, fetchReferrals]);

  // Fetch KYC documents + bank details when the KYC tab is first opened
  useEffect(() => {
    if (activeTab !== "kyc") return;
    if (!customerId) return;
    if (hasFetchedKyc.current) return;
    hasFetchedKyc.current = true;

    const fetchKyc = async () => {
      setLoadingKyc(true);
      try {
        // Fetch all attachments for this account so we can filter for KYC docs
        // and fetch bank details in parallel
        const [allAttachments, savedBank] = await Promise.all([
          listAttachments("ACCOUNT", customerId, 200).catch((err) => {
            console.error("Failed to list attachments:", err);
            return [];
          }),
          getBankDetails(customerId).catch(() => ""),
        ]);

        // Filter only KYC-related documents
        const kycTypes = ["AADHAR", "PAN", "GST_CERTIFICATE"];
        const kycDocs = allAttachments.filter((a) =>
          kycTypes.includes(a.attachmentType),
        );

        // Fetch fresh details for each document to get the signed downloadUrl
        // This ensures the files don't "disappear" or become inaccessible on refresh
        const refreshedDocsPromises = kycDocs.map(async (doc) => {
          try {
            const fresh = await getAttachment(doc.id);
            return {
              ...doc, // keep list props
              ...fresh, // overwrite with fresh details
              // Normalize URL fields
              downloadUrl:
                fresh.downloadUrl ||
                fresh.url ||
                fresh.fileUrl ||
                fresh.storageUrl,
              attachmentType: fresh.attachmentType as KycDocType,
            } as KycDocument;
          } catch (e) {
            console.warn(`Failed to refresh details for doc ${doc.id}`, e);
            // Fallback to the list item, casting type
            return {
              ...doc,
              attachmentType: doc.attachmentType as KycDocType,
            } as KycDocument;
          }
        });

        const refreshedDocs = await Promise.all(refreshedDocsPromises);
        setKycAttachments(refreshedDocs);

        setBankDetails((savedBank || customerData?.bankDetails || "").trim());
      } catch (error) {
        console.error("Error in KYC fetch flow:", error);
        toast.error("Failed to load KYC documents");
      } finally {
        setLoadingKyc(false);
      }
    };
    fetchKyc();
  }, [activeTab, customerId, customerData?.bankDetails]);

  const handleKycFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !kycUploadTarget || !customerId) return;
    const docType = kycUploadTarget as KycDocType;
    setKycUploadTarget(null);
    setKycUploading(docType);
    try {
      const uploaded = await uploadKycDocument(customerId, file, docType);
      // Replace any existing doc of the same type
      setKycAttachments((prev) => [
        ...prev.filter((a) => a.attachmentType !== docType),
        uploaded,
      ]);
      toast.success(
        `${KYC_DOCS.find((d) => d.key === docType)?.label ?? docType} uploaded successfully`,
      );
    } catch (err) {
      console.error("KYC upload error:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setKycUploading(null);
    }
  };

  const handleKycDelete = async (doc: KycDocument) => {
    if (
      !window.confirm(
        `Remove this ${doc.attachmentType.replace(/_/g, " ").toLowerCase()}?`,
      )
    )
      return;
    setKycDeleting(doc.id);
    try {
      await deleteAttachment(doc.id);
      setKycAttachments((prev) => prev.filter((a) => a.id !== doc.id));
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    } finally {
      setKycDeleting(null);
    }
  };

  const handleKycAction = (doc: KycDocument, action: "view" | "download") => {
    const url = doc.downloadUrl || doc.storageUrl || doc.fileUrl || "";
    if (!url) {
      toast.error("File URL not available");
      return;
    }
    if (action === "view") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!customerId) return;
    setBankDetailsSaving(true);
    try {
      const savedBankDetails = await saveBankDetailsApi(
        customerId,
        bankDetails,
      );
      setBankDetails(savedBankDetails);
      setCustomerData((prev) =>
        prev ? { ...prev, bankDetails: savedBankDetails } : prev,
      );
      setBankDetailsEditing(false);
      toast.success("Bank details saved");
    } catch {
      toast.error("Failed to save bank details");
    } finally {
      setBankDetailsSaving(false);
    }
  };

  // Fetch lead reference data when overview/references needs it
  useEffect(() => {
    if (activeTab !== "references" && activeTab !== "overview") return;
    const leadId = customerData?.leadId;
    if (!leadId) return;
    if (leadReferenceData || loadingLeadReferences) return; // already loaded

    const fetchLeadReferences = async () => {
      setLoadingLeadReferences(true);
      try {
        const [leadResult, attachmentsResult] = await Promise.allSettled([
          LeadAPI.getLeadById(leadId),
          listAttachments("LEAD", leadId),
        ]);

        const lead =
          leadResult.status === "fulfilled" ? leadResult.value : null;
        const fallbackLeadFromCustomer =
          (customerData?.convertedFromLead as unknown as LeadOption | null) ||
          null;
        const rawAttachments =
          attachmentsResult.status === "fulfilled"
            ? attachmentsResult.value
            : [];

        if (leadResult.status === "rejected") {
          console.warn(
            "Lead details unavailable, using attachments only:",
            leadResult.reason,
          );
        }

        if (attachmentsResult.status === "rejected") {
          console.warn(
            "Lead attachments unavailable:",
            attachmentsResult.reason,
          );
        }

        // Filter client-side to guarantee only this lead's files are shown
        const attachments = rawAttachments.filter((a) => a.entityId === leadId);
        setLeadReferenceData(lead || fallbackLeadFromCustomer);
        setLeadAttachments(attachments);
      } catch (err) {
        console.error("Failed to load lead reference data:", err);
        toast.error("Failed to load lead reference data");
      } finally {
        setLoadingLeadReferences(false);
      }
    };

    fetchLeadReferences();
  }, [
    activeTab,
    customerData?.leadId,
    customerData?.convertedFromLead,
    leadReferenceData,
    loadingLeadReferences,
  ]);

  useEffect(() => {
    if (!leadReferenceEditing) return;
    setLeadReferenceEditForm(createLeadReferenceEditForm(leadReferenceData));
  }, [leadReferenceData, leadReferenceEditing]);

  const editableLeadReferenceFields = useMemo(
    () => getEditableLeadReferenceFieldSet(leadReferenceData),
    [leadReferenceData],
  );

  const hasEditableLeadReferenceFields = editableLeadReferenceFields.size > 0;

  const updateLeadReferenceEditField = (
    field: LeadReferenceEditableField,
    value: string | boolean,
  ) => {
    setLeadReferenceEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderLeadReferenceEditField = (field: LeadReferenceEditableField) => {
    if (!editableLeadReferenceFields.has(field)) return null;

    const commonInputClass =
      "mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400";
    const fieldValue = leadReferenceEditForm[field] as string | boolean;

    const getSelectOptions = (
      targetField: LeadReferenceEditableField,
    ): SelectOption[] => {
      const baseOptions =
        targetField === "source"
          ? leadSourceOptions
          : targetField === "status"
            ? leadStatusOptions
            : targetField === "stage"
              ? LEAD_STAGE_OPTIONS
              : LEAD_FIELD_ENUM_OPTIONS[targetField] || [];

      const normalized = new Map<string, SelectOption>();
      baseOptions.forEach((option) => {
        if (option.value) {
          normalized.set(option.value, option);
        }
      });

      const currentValue = String(fieldValue || "").trim();
      if (currentValue && !normalized.has(currentValue)) {
        normalized.set(currentValue, {
          value: currentValue,
          label: formatLeadReferenceLabel(currentValue),
        });
      }

      return Array.from(normalized.values());
    };

    switch (field) {
      case "priority":
        return (
          <div key={field}>
            <label className="text-xs text-gray-500 font-medium">
              Priority
            </label>
            <select
              value={(fieldValue as string) || ""}
              onChange={(e) =>
                updateLeadReferenceEditField(field, e.target.value)
              }
              className={`${commonInputClass} bg-white`}
            >
              <option value="">Select priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        );
      case "source":
      case "status":
      case "stage":
      case "projectType":
      case "propertyProjectType":
      case "propertyType":
      case "homeType":
      case "projectStage":
      case "startTimeline":
      case "budgetComfort":
      case "projectScope":
      case "householdOrCompany":
      case "budgetTier": {
        const options = getSelectOptions(field);
        return (
          <div key={field}>
            <label className="text-xs text-gray-500 font-medium">
              {field === "source"
                ? "Source"
                : field === "status"
                  ? "Status"
                  : field === "stage"
                    ? "Stage"
                    : field === "startTimeline"
                      ? "Start Timeline"
                      : formatLeadReferenceLabel(field)}
            </label>
            <select
              value={(fieldValue as string) || ""}
              onChange={(e) =>
                updateLeadReferenceEditField(field, e.target.value)
              }
              className={`${commonInputClass} bg-white`}
            >
              <option value="">Select...</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      }
      case "score":
      case "area":
      case "carpetArea":
      case "verificationAttempts":
        return (
          <div key={field}>
            <label className="text-xs text-gray-500 font-medium">
              {field === "score"
                ? "Lead Score"
                : field === "area"
                  ? "Area (sq.ft)"
                  : field === "carpetArea"
                    ? "Carpet Area (sq.ft)"
                    : "Verification Attempts"}
            </label>
            <input
              type="number"
              value={(fieldValue as string) || ""}
              onChange={(e) =>
                updateLeadReferenceEditField(field, e.target.value)
              }
              className={commonInputClass}
            />
          </div>
        );
      case "expectedStartDate":
      case "moveinDate":
        return (
          <div key={field}>
            <label className="text-xs text-gray-500 font-medium">
              {field === "expectedStartDate"
                ? "Expected Start Date"
                : "Move-in Date"}
            </label>
            <input
              type="date"
              value={(fieldValue as string) || ""}
              onChange={(e) =>
                updateLeadReferenceEditField(field, e.target.value)
              }
              className={commonInputClass}
            />
          </div>
        );
      case "canWhatsApp":
      case "wantsExperienceCenterVisit":
      case "isPhoneVerified":
        return (
          <label
            key={field}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700"
          >
            <input
              type="checkbox"
              checked={Boolean(fieldValue)}
              onChange={(e) =>
                updateLeadReferenceEditField(field, e.target.checked)
              }
              className="rounded border-gray-300"
            />
            {field === "canWhatsApp"
              ? "Can WhatsApp"
              : field === "wantsExperienceCenterVisit"
                ? "Wants Experience Center Visit"
                : "Is Phone Verified"}
          </label>
        );
      default:
        return (
          <div key={field}>
            <label className="text-xs text-gray-500 font-medium">
              {field
                .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
                .replace(/\b\w/g, (ch) => ch.toUpperCase())}
            </label>
            <input
              type="text"
              value={(fieldValue as string) || ""}
              onChange={(e) =>
                updateLeadReferenceEditField(field, e.target.value)
              }
              className={commonInputClass}
            />
          </div>
        );
    }
  };

  const handleStartLeadReferenceEdit = () => {
    if (!hasEditableLeadReferenceFields) {
      toast("No lead fields are available to edit");
      return;
    }
    setLeadReferenceEditForm(createLeadReferenceEditForm(leadReferenceData));
    setLeadReferenceEditing(true);
  };

  const handleCancelLeadReferenceEdit = () => {
    setLeadReferenceEditForm(createLeadReferenceEditForm(leadReferenceData));
    setLeadReferenceEditing(false);
  };

  const handleSaveLeadReference = async () => {
    const leadId = customerData?.leadId;
    const currentLead = leadReferenceData;

    if (!leadId) {
      toast.error("Lead reference is not available for this customer");
      return;
    }

    if (!currentLead) {
      toast.error("Lead reference data is not loaded yet");
      return;
    }

    try {
      setLeadReferenceSaving(true);

      const updates: Partial<LeadOption> = {};

      const assignTextIfChanged = (
        formField: LeadReferenceEditableField,
        apiField: keyof LeadOption = formField as unknown as keyof LeadOption,
      ) => {
        if (!editableLeadReferenceFields.has(formField)) return;
        const next = String(leadReferenceEditForm[formField] || "").trim();
        const prev = toTextInputValue(currentLead[apiField]).trim();
        if (next !== prev) {
          (updates as Record<string, unknown>)[apiField as string] = next;
        }
      };

      assignTextIfChanged("source");
      assignTextIfChanged("status");
      assignTextIfChanged("stage");
      assignTextIfChanged("projectType");
      assignTextIfChanged("propertyProjectType");
      assignTextIfChanged("propertyType");
      assignTextIfChanged("homeType");
      assignTextIfChanged("bhkConfig");
      assignTextIfChanged("city");
      assignTextIfChanged("locality");
      assignTextIfChanged("location");
      assignTextIfChanged("projectStage");
      assignTextIfChanged("projectScope");
      assignTextIfChanged("budget");
      assignTextIfChanged("budgetRange");
      assignTextIfChanged("budgetComfort");
      assignTextIfChanged("timeline");
      assignTextIfChanged("startTimeline");
      assignTextIfChanged("companyName");
      assignTextIfChanged("householdOrCompany");
      assignTextIfChanged("budgetTier");

      if (editableLeadReferenceFields.has("message")) {
        const nextMessage = leadReferenceEditForm.message.trim();
        const previousMessage = toTextInputValue(
          currentLead.message || currentLead.requirements || currentLead.notes,
        ).trim();
        if (nextMessage !== previousMessage) {
          updates.message = nextMessage;
          updates.requirements = nextMessage;
          updates.notes = nextMessage;
        }
      }

      if (editableLeadReferenceFields.has("priority")) {
        const nextPriority = leadReferenceEditForm.priority
          .trim()
          .toLowerCase();
        const previousPriority = toTextInputValue(currentLead.priority)
          .trim()
          .toLowerCase();
        if (
          nextPriority &&
          ["high", "medium", "low"].includes(nextPriority) &&
          nextPriority !== previousPriority
        ) {
          updates.priority = nextPriority as "high" | "medium" | "low";
        }
      }

      if (editableLeadReferenceFields.has("score")) {
        const nextScore = parseOptionalNumber(
          leadReferenceEditForm.score,
          "Score",
        );
        const previousScore =
          typeof currentLead.score === "number" ? currentLead.score : undefined;
        if (nextScore !== undefined && nextScore !== previousScore) {
          updates.score = nextScore;
        }
      }

      if (editableLeadReferenceFields.has("area")) {
        const nextArea = parseOptionalNumber(
          leadReferenceEditForm.area,
          "Area",
        );
        const previousArea =
          typeof currentLead.area === "number" ? currentLead.area : undefined;
        if (nextArea !== undefined && nextArea !== previousArea) {
          updates.area = nextArea;
        }
      }

      if (editableLeadReferenceFields.has("carpetArea")) {
        const nextCarpetArea = parseOptionalNumber(
          leadReferenceEditForm.carpetArea,
          "Carpet Area",
        );
        const previousCarpetArea =
          typeof currentLead.carpetArea === "number"
            ? currentLead.carpetArea
            : undefined;
        if (
          nextCarpetArea !== undefined &&
          nextCarpetArea !== previousCarpetArea
        ) {
          updates.carpetArea = nextCarpetArea;
        }
      }

      if (editableLeadReferenceFields.has("verificationAttempts")) {
        const nextAttempts = parseOptionalNumber(
          leadReferenceEditForm.verificationAttempts,
          "Verification Attempts",
        );
        const previousAttempts =
          typeof currentLead.verificationAttempts === "number"
            ? currentLead.verificationAttempts
            : undefined;
        if (nextAttempts !== undefined && nextAttempts !== previousAttempts) {
          updates.verificationAttempts = nextAttempts;
        }
      }

      if (editableLeadReferenceFields.has("expectedStartDate")) {
        const nextDate = leadReferenceEditForm.expectedStartDate;
        const previousDate = toDateInputValue(currentLead.expectedStartDate);
        if (nextDate && nextDate !== previousDate) {
          updates.expectedStartDate = nextDate;
        }
      }

      if (editableLeadReferenceFields.has("moveinDate")) {
        const nextDate = leadReferenceEditForm.moveinDate;
        const previousDate = toDateInputValue(currentLead.moveinDate);
        if (nextDate && nextDate !== previousDate) {
          updates.moveinDate = nextDate;
        }
      }

      if (editableLeadReferenceFields.has("canWhatsApp")) {
        const nextValue = leadReferenceEditForm.canWhatsApp;
        const previousValue = Boolean(currentLead.canWhatsApp);
        if (nextValue !== previousValue) {
          updates.canWhatsApp = nextValue;
        }
      }

      if (editableLeadReferenceFields.has("wantsExperienceCenterVisit")) {
        const nextValue = leadReferenceEditForm.wantsExperienceCenterVisit;
        const previousValue = Boolean(currentLead.wantsExperienceCenterVisit);
        if (nextValue !== previousValue) {
          updates.wantsExperienceCenterVisit = nextValue;
        }
      }

      if (editableLeadReferenceFields.has("isPhoneVerified")) {
        const nextValue = leadReferenceEditForm.isPhoneVerified;
        const previousValue = Boolean(currentLead.isPhoneVerified);
        if (nextValue !== previousValue) {
          updates.isPhoneVerified = nextValue;
        }
      }

      if (Object.keys(updates).length === 0) {
        toast("No lead changes detected");
        setLeadReferenceEditing(false);
        return;
      }

      const updatedLead = await LeadAPI.updateLead(leadId, updates);

      setLeadReferenceData(updatedLead);
      setCustomerData((prev) =>
        prev
          ? {
              ...prev,
              convertedFromLead:
                updatedLead as unknown as APICustomer["convertedFromLead"],
            }
          : prev,
      );
      setLeadReferenceEditing(false);
      toast.success("Lead details updated successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update lead details";
      toast.error(message);
    } finally {
      setLeadReferenceSaving(false);
    }
  };

  // Load leads list when referral modal opens
  useEffect(() => {
    if (!showReferralModal) return;
    setLoadingLeads(true);
    LeadAPI.listLeads({ limit: 200 })
      .then((res) => setAllLeads(res.leads || []))
      .catch(() => toast.error("Failed to load leads"))
      .finally(() => setLoadingLeads(false));
  }, [showReferralModal]);

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    if (!customerData?.id) return;

    try {
      // Use the customer's leadId if available, otherwise use customer ID
      const leadIdToUse = customerData.leadId || String(customerData.id);
      const response = await ContactAPI.listContacts({ leadId: leadIdToUse });
      const fetchedContacts = response.contacts || [];

      if (fetchedContacts.length > 0) {
        setContacts(fetchedContacts);

        // Update customer email and phone from the primary contact
        const primaryContact =
          fetchedContacts.find((c) => c.isPrimary) || fetchedContacts[0];
        setCustomerData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            email: primaryContact.email || prev.email || "",
            phone: primaryContact.phone || prev.phone || "",
          };
        });
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      // Don't show error toast on initial load - contacts may not exist yet
    }
  }, [customerData?.id, customerData?.leadId]);

  // Load contacts when customerData changes (but only once per customer)
  useEffect(() => {
    if (customerData?.id) {
      fetchContacts();
    }
  }, [customerData?.id, customerData?.leadId, fetchContacts]);

  // Fetch projects for this customer
  useEffect(() => {
    const fetchCustomerProjects = async () => {
      if (!customerData?.id) return;

      setProjectsLoading(true);
      try {
        const response = await listProjects({
          accountId: String(customerData.id),
          limit: 5000,
        });
        setCustomerProjects(response.projects);
        const totalValueFromProjects = (response.projects || []).reduce(
          (sum, project) => sum + toCurrencyNumber(project.totalValue),
          0,
        );
        const projectCount = response.projects?.length || 0;
        setCustomerData((prev) =>
          prev
            ? {
                ...prev,
                projects: projectCount,
                projectsCount: projectCount,
                totalValue: totalValueFromProjects,
              }
            : prev,
        );
        console.log(
          `Found ${response.projects.length} projects for customer:`,
          response.projects,
        );
      } catch (error) {
        console.error("Error fetching customer projects:", error);
        toast.error("Failed to load customer projects");
      } finally {
        setProjectsLoading(false);
      }
    };

    if (customerData?.id) {
      fetchCustomerProjects();
    }
  }, [customerData?.id]);

  const customer = customerData;

  useEffect(() => {
    if (customerData && !editingProjectIntake) {
      setIntakeEditForm(buildIntakeEditFormFromCustomer(customerData));
    }
  }, [customerData, editingProjectIntake]);

  const additionalLeadReferenceFields =
    getAdditionalLeadReferenceFields(leadReferenceData);

  const getValidationDetails = (
    error: unknown,
  ): { message: string; field?: "email" | "phone" | "status" } => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to save changes";

    const lowered = message.toLowerCase();
    if (lowered.includes("email") && lowered.includes("exist")) {
      return { message, field: "email" };
    }
    if (lowered.includes("phone") && lowered.includes("exist")) {
      return { message, field: "phone" };
    }
    // PUT /api/customers/:id — cannot set inactive while projects exist
    if (
      lowered.includes("inactive") &&
      (lowered.includes("project") || lowered.includes("projects"))
    ) {
      return { message, field: "status" };
    }

    return { message };
  };

  // Save customer data to backend
  const handleSaveCustomer = async (updates: Partial<Customer>) => {
    if (!customer || isSaving) return;

    setIsSaving(true);
    setValidationAlert(null);
    const previousData = { ...customer };

    setCustomerData((prev) => {
      if (!prev) return prev;
      const next: Customer = { ...prev, ...updates };
      if (updates.customerIntake) {
        next.customerIntake = {
          ...prev.customerIntake,
          ...updates.customerIntake,
        };
      }
      return next;
    });

    try {
      const apiUpdates: Record<string, unknown> = {};

      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.status !== undefined)
        apiUpdates.status = updates.status.toUpperCase();
      if (updates.type !== undefined)
        apiUpdates.type = updates.type.toUpperCase();
      if (updates.email !== undefined) {
        const normalizedEmail = updates.email.trim();
        apiUpdates.email = normalizedEmail.length > 0 ? normalizedEmail : null;
      }
      if (updates.phone !== undefined) {
        const normalizedPhone = updates.phone.trim();
        apiUpdates.phone = normalizedPhone.length > 0 ? normalizedPhone : null;
      }
      if (updates.notes !== undefined) {
        apiUpdates.notes =
          updates.notes && updates.notes.length > 0
            ? updates.notes.map((n) => n.content).join("\n")
            : null;
      }
      if (updates.familyMembers !== undefined) {
        apiUpdates.familyMembers = updates.familyMembers;
      }
      if (updates.importantDates !== undefined) {
        apiUpdates.importantDates = updates.importantDates;
      }
      if (updates.secondaryEmails !== undefined) {
        apiUpdates.secondaryEmails = updates.secondaryEmails;
      }
      if (updates.secondaryPhones !== undefined) {
        apiUpdates.secondaryPhones = updates.secondaryPhones;
      }
      if (updates.clientRanking !== undefined) {
        const rankingNote = `Client Ranking: ${updates.clientRanking}`;
        apiUpdates.notes = apiUpdates.notes
          ? `${apiUpdates.notes}\n${rankingNote}`
          : rankingNote;
      }

      if (updates.companyName !== undefined) {
        apiUpdates.companyName = updates.companyName?.trim() || null;
      }
      if (updates.occupation !== undefined) {
        apiUpdates.occupation = updates.occupation?.trim() || null;
      }

      if (updates.customerIntake !== undefined) {
        const i = updates.customerIntake;
        if (i.propertyType !== undefined)
          apiUpdates.propertyType = i.propertyType?.trim() || null;
        if (i.projectType !== undefined)
          apiUpdates.projectType = i.projectType?.trim() || null;
        if (i.city !== undefined) apiUpdates.city = i.city?.trim() || null;
        if (i.projectStage !== undefined)
          apiUpdates.projectStage = i.projectStage?.trim() || null;
        if (i.startTimeline !== undefined)
          apiUpdates.startTimeline = i.startTimeline?.trim() || null;
        if (i.budgetComfort !== undefined)
          apiUpdates.budgetComfort = i.budgetComfort?.trim() || null;
        if (i.projectScope !== undefined)
          apiUpdates.projectScope = i.projectScope?.trim() || null;
        if (i.requirements !== undefined)
          apiUpdates.requirements = i.requirements?.trim() || null;
        if (i.messageNotes !== undefined)
          apiUpdates.messageNotes = i.messageNotes?.trim() || null;
        if (i.floorPlanUrl !== undefined)
          apiUpdates.floorPlanUrl = i.floorPlanUrl?.trim() || null;
        if (i.floorPlan !== undefined)
          apiUpdates.floorPlan = i.floorPlan?.trim() || null;
        if (i.area !== undefined) {
          const raw = String(i.area ?? "")
            .replace(/,/g, "")
            .trim();
          if (raw === "") apiUpdates.area = null;
          else {
            const n = parseFloat(raw);
            apiUpdates.area = Number.isFinite(n) ? n : null;
          }
        }
      }

      const updated = await CustomerAPI.updateCustomer(
        String(customer.id),
        apiUpdates,
      );

      setCustomerData((prev) => {
        if (!prev) return prev;
        const u = updated as unknown as Record<string, unknown>;
        const mergedIntake = mergeCustomerIntakeFromApi(u);
        const st = String((updated as { status?: string }).status || "")
          .toLowerCase()
          .trim();
        const nextStatus: Customer["status"] =
          st === "active" || st === "inactive" || st === "completed"
            ? st
            : prev.status;
        return {
          ...prev,
          name: (updated as { name?: string }).name ?? prev.name,
          email: String(
            (updated as { email?: string | null }).email ?? prev.email ?? "",
          ),
          phone: String(
            (updated as { phone?: string | null }).phone ?? prev.phone ?? "",
          ),
          type: (updated as { type?: string }).type ?? prev.type,
          status: nextStatus,
          secondaryEmails:
            (updated as { secondaryEmails?: string[] }).secondaryEmails ??
            prev.secondaryEmails,
          secondaryPhones:
            (updated as { secondaryPhones?: string[] }).secondaryPhones ??
            prev.secondaryPhones,
          companyName:
            mergedIntake.companyName ??
            (updated as { companyName?: string }).companyName ??
            prev.companyName,
          occupation:
            (updated as { occupation?: string }).occupation ?? prev.occupation,
          customerIntake: { ...prev.customerIntake, ...mergedIntake },
        };
      });

      setValidationAlert(null);
      toast.success("Customer updated successfully!");
      return true;
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      // Rollback
      setCustomerData(previousData);
      const { message, field } = getValidationDetails(error);
      setValidationAlert({ message, field });
      toast.error(message || "Failed to save changes");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers
  const resetFamilyForm = () =>
    setFamilyForm({
      firstName: "",
      lastName: "",
      relationship: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      occupation: "",
      notes: "",
    });

  const handleAddFamily = async () => {
    if (!customer || !familyForm.firstName || !familyForm.relationship) return;

    setIsSaving(true);
    try {
      const payload: any = {
        firstName: familyForm.firstName,
        relationship: familyForm.relationship,
      };
      if (familyForm.lastName) payload.lastName = familyForm.lastName;
      if (familyForm.dateOfBirth) payload.dateOfBirth = familyForm.dateOfBirth;
      if (familyForm.phone) payload.phone = familyForm.phone;
      if (familyForm.email) payload.email = familyForm.email;
      if (familyForm.occupation) payload.occupation = familyForm.occupation;
      if (familyForm.notes) payload.notes = familyForm.notes;

      const result = await CustomerAPI.addFamilyMember(
        String(customer.id),
        payload,
      );

      // Optimistically add the new member to local state
      const newMember: FamilyMember = {
        id: result?.familyMember?.id || result?.id || String(Date.now()),
        firstName: familyForm.firstName,
        lastName: familyForm.lastName || undefined,
        relationship: familyForm.relationship,
        dateOfBirth: familyForm.dateOfBirth || undefined,
        phone: familyForm.phone || undefined,
        email: familyForm.email || undefined,
        occupation: familyForm.occupation || undefined,
        notes: familyForm.notes || undefined,
        name: [familyForm.firstName, familyForm.lastName]
          .filter(Boolean)
          .join(" "),
      };

      setCustomerData((prev) =>
        prev
          ? {
              ...prev,
              familyMembers: [...(prev.familyMembers || []), newMember],
            }
          : prev,
      );

      resetFamilyForm();
      setShowFamilyModal(false);
      toast.success("Family member added successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add family member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFamily = async () => {
    if (!editingMember?.id || !familyForm.firstName || !familyForm.relationship)
      return;

    setIsSaving(true);
    try {
      const payload: any = {
        firstName: familyForm.firstName,
        relationship: familyForm.relationship,
      };
      if (familyForm.lastName !== undefined)
        payload.lastName = familyForm.lastName;
      if (familyForm.dateOfBirth !== undefined)
        payload.dateOfBirth = familyForm.dateOfBirth;
      if (familyForm.phone !== undefined) payload.phone = familyForm.phone;
      if (familyForm.email !== undefined) payload.email = familyForm.email;
      if (familyForm.occupation !== undefined)
        payload.occupation = familyForm.occupation;
      if (familyForm.notes !== undefined) payload.notes = familyForm.notes;

      await CustomerAPI.updateFamilyMember(editingMember.id, payload);

      // Update local state
      setCustomerData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          familyMembers: (prev.familyMembers || []).map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  firstName: familyForm.firstName,
                  lastName: familyForm.lastName || undefined,
                  relationship: familyForm.relationship,
                  dateOfBirth: familyForm.dateOfBirth || undefined,
                  phone: familyForm.phone || undefined,
                  email: familyForm.email || undefined,
                  occupation: familyForm.occupation || undefined,
                  notes: familyForm.notes || undefined,
                  name: [familyForm.firstName, familyForm.lastName]
                    .filter(Boolean)
                    .join(" "),
                }
              : m,
          ),
        };
      });

      resetFamilyForm();
      setEditingMember(null);
      setShowFamilyModal(false);
      toast.success("Family member updated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update family member");
    } finally {
      setIsSaving(false);
    }
  };

  const resetDateForm = () => {
    setDateForm({
      dateType: "BIRTHDAY",
      date: "",
      isRecurring: true,
      reminderDays: 7,
      notes: "",
      customLabel: "",
    });
    setEditingImportantDate(null);
  };

  const closeDateModal = () => {
    setShowDateModal(false);
    resetDateForm();
  };

  const openAddImportantDateModal = () => {
    setEditingImportantDate(null);
    setDateForm({
      dateType: "BIRTHDAY",
      date: "",
      isRecurring: true,
      reminderDays: 7,
      notes: "",
      customLabel: "",
    });
    setShowDateModal(true);
  };

  const openEditImportantDateModal = (date: ImportantDate) => {
    if (!date.id) {
      toast.error("This date cannot be edited (missing id).");
      return;
    }
    const raw = String(date.date || "");
    const dateInput = raw.includes("T")
      ? raw.split("T")[0]!
      : raw.slice(0, 10);
    setEditingImportantDate(date);
    setDateForm({
      dateType: (date.dateType || "BIRTHDAY").toUpperCase(),
      date: dateInput,
      isRecurring: date.isRecurring ?? true,
      reminderDays: date.reminderDays ?? 7,
      notes: date.notes || "",
      customLabel: date.customLabel || "",
    });
    setShowDateModal(true);
  };

  const handleSaveImportantDate = async () => {
    if (!customer || !dateForm.dateType || !dateForm.date) return;

    const today = formatLocalDateYMD(new Date());
    if (dateForm.date > today) {
      toast.error(
        "Please choose today or a past date. Future dates are not allowed.",
      );
      return;
    }

    setIsSaving(true);
    try {
      if (editingImportantDate?.id) {
        const body: UpdateImportantDateInput = {
          date: dateForm.date,
          dateType: dateForm.dateType,
          isRecurring: dateForm.isRecurring,
          reminderDays: Number(dateForm.reminderDays),
          notes: dateForm.notes,
        };
        if (dateForm.dateType === "CUSTOM") {
          body.customLabel = dateForm.customLabel.trim();
        }

        const result = await CustomerAPI.updateImportantDate(
          editingImportantDate.id,
          body,
        );

        setCustomerData((prev) => {
          if (!prev) return prev;
          const merged: ImportantDate = {
            id: result.id,
            dateType: result.dateType,
            date: result.date,
            isRecurring: result.isRecurring,
            reminderDays: result.reminderDays,
            notes: result.notes ?? undefined,
            customLabel: result.customLabel ?? undefined,
          };
          return {
            ...prev,
            importantDates: (prev.importantDates || []).map((d) =>
              d.id === editingImportantDate.id ? merged : d,
            ),
          };
        });

        closeDateModal();
        toast.success("Important date updated successfully!");
      } else {
        const payload: Parameters<typeof CustomerAPI.addImportantDate>[1] = {
          dateType: dateForm.dateType,
          date: dateForm.date,
          isRecurring: dateForm.isRecurring,
          reminderDays: Number(dateForm.reminderDays),
          notes: dateForm.notes,
        };
        if (dateForm.dateType === "CUSTOM") {
          payload.customLabel = dateForm.customLabel.trim();
        }

        const result = await CustomerAPI.addImportantDate(
          String(customer.id),
          payload,
        );

        setCustomerData((prev) => {
          if (!prev) return prev;
          const newDate: ImportantDate = {
            id: result.id,
            dateType: result.dateType,
            date: result.date,
            isRecurring: result.isRecurring,
            reminderDays: result.reminderDays,
            notes: result.notes,
            customLabel: result.customLabel ?? undefined,
          };
          return {
            ...prev,
            importantDates: [...(prev.importantDates || []), newDate],
          };
        });

        closeDateModal();
        toast.success("Important date added successfully!");
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          (editingImportantDate
            ? "Failed to update important date"
            : "Failed to add important date"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  /** Delete by id (list row or modal); closes modal if it was editing this id. */
  const confirmDeleteImportantDate = async (id: string) => {
    if (!customer || !id) return;
    if (
      !window.confirm(
        "Delete this important date? This cannot be undone.",
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      await CustomerAPI.deleteImportantDate(id);
      setCustomerData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          importantDates: (prev.importantDates || []).filter(
            (d) => d.id !== id,
          ),
        };
      });
      if (editingImportantDate?.id === id) {
        closeDateModal();
      }
      toast.success("Important date deleted.");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete important date",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImportantDate = () => {
    if (editingImportantDate?.id) {
      void confirmDeleteImportantDate(editingImportantDate.id);
    }
  };

  const handleAddReferral = async () => {
    if (!referralForm.leadId || !customerId) return;

    try {
      await fetchAPI("/api/referrals/refer-lead", {
        method: "POST",
        body: JSON.stringify({
          leadId: referralForm.leadId,
          customerId,
        }),
      });

      setReferralForm({ leadId: "" });
      setShowReferralModal(false);
      toast.success("Referral added successfully!");
      // Refresh the list from API
      fetchReferrals();
    } catch (err) {
      console.error("Failed to add referral:", err);
      toast.error("Failed to add referral. Please try again.");
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
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      setCustomerData((prev) => (prev ? { ...prev, photoUrl } : prev));
      toast.success("Photo uploaded successfully!");
      // TODO: Upload to server and save photoUrl when backend supports it
    };
    reader.readAsDataURL(file);
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
      console.error("Failed to delete customer:", error);

      // Show error toast with specific message
      const errorMessage = error?.message || "Failed to delete customer";
      toast.error(errorMessage);

      // Keep dialog open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  // Find customer by ID
  // const customer = mockCustomers.find((c) => c.id === Number(customerId));

  if (loadingCustomer) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-orange-50/30 via-gray-50 to-white py-6">
        <div className="max-w-7xl mx-auto px-4 space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-6 w-44 rounded-lg bg-gray-200" />
            <div className="h-9 w-32 rounded-xl bg-gray-200" />
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="h-9 w-72 rounded-xl bg-gray-200" />
                <div className="h-5 w-56 rounded-lg bg-gray-200" />
              </div>
              <div className="h-8 w-24 rounded-full bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-56 rounded-2xl bg-white border border-gray-200/80" />
              <div className="h-64 rounded-2xl bg-white border border-gray-200/80" />
            </div>
            <div className="space-y-6">
              <div className="h-44 rounded-2xl bg-white border border-gray-200/80" />
              <div className="h-44 rounded-2xl bg-white border border-gray-200/80" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-gray-500">
            <div className="w-6 h-6 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
            <p className="text-sm font-medium tracking-wide">
              Loading customer details...
            </p>
          </div>
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

  const statusColor =
    statusColors[customer.status as keyof typeof statusColors] ||
    statusColors[customer.status?.toLowerCase() as keyof typeof statusColors] ||
    statusColors.inactive;
  const rankingColor = customer.clientRanking
    ? rankingColors[customer.clientRanking]
    : null;

  return (
    <div className="space-y-8 animate-fade-in w-full">
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
                <div className="flex-1 min-w-0">
                  {editingTab !== "profile" ? (
                    <>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                          {customer.name}
                        </h1>
                        {customer.customerNumber && (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                            Customer No: {customer.customerNumber}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                          />
                          {customer.status}
                        </span>
                        {rankingColor && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${rankingColor.bg} ${rankingColor.text}`}
                          >
                            {rankingColor.icon} {customer.clientRanking}
                          </span>
                        )}
                        {customer.type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                            {customer.type.toLowerCase()}
                          </span>
                        )}
                      </div>
                      {(customer.occupation || customer.companyName) && (
                        <p className="text-sm text-gray-500">
                          {customer.occupation}
                          {customer.occupation && customer.companyName
                            ? " at "
                            : ""}
                          {customer.companyName}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {validationAlert && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700">
                            {validationAlert.message}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={profileEditForm.name}
                          onChange={(e) =>
                            setProfileEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                          placeholder="Customer name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Status
                          </label>
                          <select
                            value={profileEditForm.status}
                            onChange={(e) => {
                              if (validationAlert?.field === "status") {
                                setValidationAlert(null);
                              }
                              setProfileEditForm((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }));
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                              validationAlert?.field === "status"
                                ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                                : "border-gray-200 focus:ring-orange-200 focus:border-orange-400"
                            }`}
                          >
                            {(customerStatuses.length > 0
                              ? customerStatuses
                              : [
                                  { value: "ACTIVE", label: "Active" },
                                  { value: "INACTIVE", label: "Inactive" },
                                  { value: "COMPLETED", label: "Completed" },
                                ]
                            ).map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Customer Type
                          </label>
                          <select
                            value={profileEditForm.type}
                            onChange={(e) =>
                              setProfileEditForm((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                          >
                            <option value="">Select type...</option>
                            {(customerTypes.length > 0
                              ? customerTypes
                              : [
                                  {
                                    value: "RESIDENTIAL",
                                    label: "Residential",
                                  },
                                  {
                                    value: "COMMERCIAL",
                                    label: "Commercial",
                                  },
                                ]
                            ).map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit / Save button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingTab === "profile" && (
                    <button
                      onClick={() => {
                        setValidationAlert(null);
                        setEditingTab(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (editingTab === "profile") {
                        if (!profileEditForm.name.trim()) {
                          toast.error("Customer name is required");
                          return;
                        }
                        const updates: Partial<Customer> = {};
                        if (profileEditForm.name !== customer.name)
                          updates.name = profileEditForm.name;
                        if (
                          profileEditForm.status !==
                          customer.status.toUpperCase()
                        )
                          updates.status =
                            profileEditForm.status.toLowerCase() as Customer["status"];
                        if (
                          profileEditForm.type !==
                          (customer.type || "").toUpperCase()
                        )
                          updates.type = profileEditForm.type;
                        if (Object.keys(updates).length === 0) {
                          setEditingTab(null);
                          return;
                        }
                        const success = await handleSaveCustomer(updates);
                        if (success !== false) setEditingTab(null);
                      } else {
                        setProfileEditForm({
                          name: customer.name,
                          type: (customer.type || "").toUpperCase(),
                          status: customer.status.toUpperCase(),
                        });
                        setEditingTab("profile");
                      }
                    }}
                    disabled={isSaving && editingTab === "profile"}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                      editingTab === "profile"
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {isSaving && editingTab === "profile" ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : editingTab === "profile" ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Pencil className="w-3 h-3" />
                    )}
                    {editingTab === "profile" ? "Save" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Contact row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-gray-400" />
                    {customer.phone}
                  </a>
                )}
                {customer.location && customer.location !== "N/A" && (
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
              <p className="text-2xl font-bold text-gray-900">
                {customerProjects.length}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                Projects
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {customer.contactsCount || 0}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                Contacts
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-gray-900">
                ₹{(customer.totalValue / 100000).toFixed(1)}L
              </p>
              <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wider">
                Total Value
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Customer Information */}
      {(customer.type ||
        customer.ownerName ||
        customer.billingAddress ||
        customer.shippingAddress ||
        customer.taxId ||
        customer.createdAt) && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-5">
            {customer.type && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Customer Type
                </p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {customer.type.toLowerCase()}
                </p>
              </div>
            )}
            {customer.taxId && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Tax ID</p>
                <p className="text-sm font-semibold text-gray-900">
                  {customer.taxId}
                </p>
              </div>
            )}
            {customer.ownerName && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Lead By
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {customer.ownerName}
                </p>
                {customer.ownerEmail && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {customer.ownerEmail}
                  </p>
                )}
              </div>
            )}
            {customer.createdAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Created
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(customer.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {customer.updatedAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Last Updated
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(customer.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(customer.updatedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {(customer.billingAddress ||
              customer.billingCity ||
              customer.shippingAddress ||
              customer.shippingCity) && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Client Address
                </p>
                <p className="text-sm text-gray-900">
                  {customer.billingAddress || customer.shippingAddress}
                </p>
                {(() => {
                  const city = customer.billingCity || customer.shippingCity;
                  const state = customer.billingState || customer.shippingState;
                  const pincode =
                    customer.billingPincode || customer.shippingPincode;
                  const parts = [city, state, pincode].filter(Boolean);
                  return parts.length > 0 ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {parts.join(", ")}
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl overflow-x-auto">
        {[
          { key: "overview", label: "Overview", icon: FileText },
          { key: "family", label: "Family", icon: Users },
          { key: "dates", label: "Dates", icon: Calendar },
          { key: "referrals", label: "Referrals", icon: UserPlus },
          { key: "notes", label: "Notes", icon: MessageCircle },
          { key: "ranking", label: "Ranking", icon: Award },
          { key: "projects", label: "Projects", icon: FolderOpen },
          { key: "kyc", label: "KYC", icon: Shield },
          { key: "references", label: "References", icon: Link2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab);
                setEditingTab(null);
              }}
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
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <button
                    onClick={async () => {
                      if (editingTab === "overview") {
                        const success = await handleSaveCustomer({
                          email: contactEditForm.email,
                          phone: contactEditForm.phone,
                          secondaryEmails: contactEditForm.secondaryEmails,
                          secondaryPhones: contactEditForm.secondaryPhones,
                        });
                        if (success !== false) setEditingTab(null);
                      } else {
                        setValidationAlert(null);
                        setContactEditForm({
                          email: customer.email || "",
                          phone: customer.phone || "",
                          secondaryEmails: customer.secondaryEmails || [],
                          secondaryPhones: customer.secondaryPhones || [],
                          newEmail: "",
                          newPhone: "",
                        });
                        setEditingTab("overview");
                      }
                    }}
                    disabled={isSaving}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                      editingTab === "overview"
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : editingTab === "overview" ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Edit2 className="w-3 h-3" />
                    )}
                    {editingTab === "overview" ? "Save" : "Edit"}
                  </button>
                </div>

                {/* VIEW MODE */}
                {editingTab !== "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Primary email */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">
                          Email
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {/* Primary phone */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">
                          Phone
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {/* Secondary emails */}
                    {(customer.secondaryEmails || []).map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-orange-50/40 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Email {idx + 2}
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Secondary phones */}
                    {(customer.secondaryPhones || []).map((phone, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-blue-50/40 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Phone {idx + 2}
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {phone}
                          </p>
                        </div>
                      </div>
                    ))}
                    {customer.communicationPreference && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Preferred Contact
                          </p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {customer.communicationPreference}
                          </p>
                        </div>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl md:col-span-2">
                        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">
                            Address
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {customer.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* EDIT MODE */}
                {editingTab === "overview" && (
                  <div className="space-y-5">
                    {validationAlert && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">
                          {validationAlert.message}
                        </p>
                      </div>
                    )}

                    {/* Editable primary fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Primary Email
                        </label>
                        <div
                          className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl focus-within:ring-1 ${
                            validationAlert?.field === "email"
                              ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                              : "border-gray-200 focus-within:border-orange-400 focus-within:ring-orange-100"
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <input
                            type="email"
                            value={contactEditForm.email}
                            onChange={(e) =>
                              setContactEditForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="Primary email"
                            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Primary Phone
                        </label>
                        <div
                          className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl focus-within:ring-1 ${
                            validationAlert?.field === "phone"
                              ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                              : "border-gray-200 focus-within:border-blue-400 focus-within:ring-blue-100"
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <input
                            type="tel"
                            value={contactEditForm.phone}
                            onChange={(e) =>
                              setContactEditForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="Primary phone"
                            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Emails */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Additional Emails
                      </p>
                      <div className="space-y-2">
                        {contactEditForm.secondaryEmails.map((email, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-orange-50/50 border border-orange-100 rounded-xl">
                              <Mail className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                              <span className="text-sm text-gray-800 truncate">
                                {email}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryEmails: prev.secondaryEmails.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <input
                              type="email"
                              placeholder="Add email address..."
                              value={contactEditForm.newEmail}
                              onChange={(e) =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  newEmail: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  contactEditForm.newEmail.trim()
                                ) {
                                  setContactEditForm((prev) => ({
                                    ...prev,
                                    secondaryEmails: [
                                      ...prev.secondaryEmails,
                                      prev.newEmail.trim(),
                                    ],
                                    newEmail: "",
                                  }));
                                }
                              }}
                              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (contactEditForm.newEmail.trim()) {
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryEmails: [
                                    ...prev.secondaryEmails,
                                    prev.newEmail.trim(),
                                  ],
                                  newEmail: "",
                                }));
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-500 hover:text-orange-600 transition-colors flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Phones */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Additional Phone Numbers
                      </p>
                      <div className="space-y-2">
                        {contactEditForm.secondaryPhones.map((phone, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              <span className="text-sm text-gray-800 truncate">
                                {phone}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryPhones: prev.secondaryPhones.filter(
                                    (_, i) => i !== idx,
                                  ),
                                }))
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <input
                              type="tel"
                              placeholder="Add phone number..."
                              value={contactEditForm.newPhone}
                              onChange={(e) =>
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  newPhone: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  contactEditForm.newPhone.trim()
                                ) {
                                  setContactEditForm((prev) => ({
                                    ...prev,
                                    secondaryPhones: [
                                      ...prev.secondaryPhones,
                                      prev.newPhone.trim(),
                                    ],
                                    newPhone: "",
                                  }));
                                }
                              }}
                              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (contactEditForm.newPhone.trim()) {
                                setContactEditForm((prev) => ({
                                  ...prev,
                                  secondaryPhones: [
                                    ...prev.secondaryPhones,
                                    prev.newPhone.trim(),
                                  ],
                                  newPhone: "",
                                }));
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Project fields — PUT /api/customers/:id (aligned with CRM API) */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Home className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Project details
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        propertyType, projectType, area, city, timelines, scope,
                        requirements, floorPlanUrl — same fields as the update
                        customer API. Name, type, status, and contacts are edited
                        above.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingProjectIntake && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProjectIntake(false);
                          setIntakeEditForm(
                            buildIntakeEditFormFromCustomer(customer),
                          );
                        }}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (editingProjectIntake) {
                          const success = await handleSaveCustomer({
                            customerIntake: {
                              propertyType: intakeEditForm.propertyType,
                              projectType: intakeEditForm.projectType,
                              area: intakeEditForm.area,
                              city: intakeEditForm.city,
                              startTimeline: intakeEditForm.startTimeline,
                              budgetComfort: intakeEditForm.budgetComfort,
                              projectScope: intakeEditForm.projectScope,
                              requirements: intakeEditForm.requirements,
                              floorPlanUrl: intakeEditForm.floorPlanUrl,
                            },
                          });
                          if (success !== false) setEditingProjectIntake(false);
                        } else {
                          setIntakeEditForm(
                            buildIntakeEditFormFromCustomer(customer),
                          );
                          setEditingProjectIntake(true);
                        }
                      }}
                      disabled={isSaving}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                        editingProjectIntake
                          ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {isSaving && editingProjectIntake ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : editingProjectIntake ? (
                        <Save className="w-3.5 h-3.5" />
                      ) : (
                        <Edit2 className="w-3.5 h-3.5" />
                      )}
                      {editingProjectIntake ? "Save" : "Edit"}
                    </button>
                  </div>
                </div>

                {editingProjectIntake ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Property type
                        </label>
                        <select
                          value={intakeEditForm.propertyType}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              propertyType: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                        >
                          {mergeIntakeSelectOptions(
                            INTAKE_PROPERTY_TYPE_OPTIONS,
                            intakeEditForm.propertyType,
                          ).map((o) => (
                            <option key={o.value || "empty"} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Project type
                        </label>
                        <select
                          value={intakeEditForm.projectType}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              projectType: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                        >
                          {mergeIntakeSelectOptions(
                            INTAKE_PROJECT_TYPE_OPTIONS,
                            intakeEditForm.projectType,
                          ).map((o) => (
                            <option key={o.value || "empty-p"} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Area (e.g. sq.ft)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={intakeEditForm.area}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              area: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                          placeholder="3000"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          City
                        </label>
                        <input
                          type="text"
                          value={intakeEditForm.city}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              city: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                          placeholder="Bangalore"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Start timeline
                        </label>
                        <select
                          value={intakeEditForm.startTimeline}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              startTimeline: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                        >
                          {mergeIntakeSelectOptions(
                            INTAKE_START_TIMELINE_OPTIONS,
                            intakeEditForm.startTimeline,
                          ).map((o) => (
                            <option key={o.value || "empty-t"} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Budget comfort
                        </label>
                        <select
                          value={intakeEditForm.budgetComfort}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              budgetComfort: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                        >
                          {mergeIntakeSelectOptions(
                            INTAKE_BUDGET_COMFORT_OPTIONS,
                            intakeEditForm.budgetComfort,
                          ).map((o) => (
                            <option key={o.value || "empty-b"} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Project scope
                        </label>
                        <select
                          value={intakeEditForm.projectScope}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              projectScope: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
                        >
                          {mergeIntakeSelectOptions(
                            INTAKE_PROJECT_SCOPE_OPTIONS,
                            intakeEditForm.projectScope,
                          ).map((o) => (
                            <option key={o.value || "empty-sc"} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Floor plan URL
                        </label>
                        <input
                          type="url"
                          value={intakeEditForm.floorPlanUrl}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              floorPlanUrl: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                          placeholder="https://…"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Requirements
                        </label>
                        <textarea
                          rows={3}
                          value={intakeEditForm.requirements}
                          onChange={(e) =>
                            setIntakeEditForm((p) => ({
                              ...p,
                              requirements: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-y min-h-[72px]"
                          placeholder="What the customer is looking for"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const intake = customer.customerIntake || {};
                    const rowEntries: [string, string][] = [];
                    for (const k of PUT_PROJECT_INTAKE_KEYS) {
                      const val = intake[k];
                      if (val && String(val).trim())
                        rowEntries.push([k as string, String(val)]);
                    }
                    if (rowEntries.length === 0) {
                      return (
                        <p className="text-sm text-gray-500 py-2">
                          No project details yet. Click Edit to add fields (matches
                          PUT /api/customers).
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rowEntries.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-xl"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-400 font-medium">
                                {formatCustomerIntakeLabel(key)}
                              </p>
                              <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-pre-wrap break-words">
                                {key === "floorPlanUrl" &&
                                /^https?:\/\//i.test(value) ? (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-600 hover:underline"
                                  >
                                    {value}
                                  </a>
                                ) : (
                                  formatCustomerIntakeDisplayValue(key, value)
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </>
          )}

          {activeTab === "family" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Family Members
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "family") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("family");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "family"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "family" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "family" ? "Save" : "Edit"}
                </button>
              </div>
              {customer.familyMembers && customer.familyMembers.length > 0 ? (
                <div className="space-y-3">
                  {customer.familyMembers.map((member, index) => {
                    const displayName = member.firstName
                      ? [member.firstName, member.lastName]
                          .filter(Boolean)
                          .join(" ")
                      : member.name || "Unknown";
                    const initial = displayName.charAt(0).toUpperCase();
                    const relLabel =
                      relationshipTypes.find(
                        (r) => r.value === member.relationship,
                      )?.label || member.relationship;
                    return (
                      <div
                        key={member.id || index}
                        className="p-4 bg-gray-50/80 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-sm font-semibold text-orange-600 shrink-0">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                                  {relLabel}
                                </span>
                                {editingTab === "family" && member.id && (
                                  <button
                                    onClick={() => {
                                      setEditingMember(member);
                                      setFamilyForm({
                                        firstName:
                                          member.firstName ||
                                          member.name?.split(" ")[0] ||
                                          "",
                                        lastName:
                                          member.lastName ||
                                          member.name
                                            ?.split(" ")
                                            .slice(1)
                                            .join(" ") ||
                                          "",
                                        relationship: member.relationship || "",
                                        dateOfBirth: member.dateOfBirth || "",
                                        phone: member.phone || "",
                                        email: member.email || "",
                                        occupation: member.occupation || "",
                                        notes: member.notes || "",
                                      });
                                      setShowFamilyModal(true);
                                    }}
                                    className="p-1 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                    title="Edit member"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {member.occupation && (
                                <span className="text-xs text-gray-500">
                                  {member.occupation}
                                </span>
                              )}
                              {member.phone && (
                                <span className="text-xs text-gray-400">
                                  {member.phone}
                                </span>
                              )}
                              {member.email && (
                                <span className="text-xs text-gray-400">
                                  {member.email}
                                </span>
                              )}
                              {member.dateOfBirth && (
                                <span className="text-xs text-gray-400">
                                  DOB:{" "}
                                  {new Date(
                                    member.dateOfBirth,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                              {/* legacy age field */}
                              {member.age && !member.dateOfBirth && (
                                <span className="text-xs text-gray-400">
                                  Age {member.age}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No family members added
                  </p>
                </div>
              )}
              {editingTab === "family" && (
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
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 min-w-0">
                  <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                  Important Dates
                </h3>
                <button
                  type="button"
                  onClick={openAddImportantDateModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Date
                </button>
              </div>
              {customer.importantDates && customer.importantDates.length > 0 ? (
                <div className="space-y-3">
                  {customer.importantDates.map((date, index) => {
                    const typeKey = date.dateType?.toLowerCase() || "custom";
                    const icons: Record<string, string> = {
                      birthday: "🎂",
                      anniversary: "💐",
                      housewarming: "🏠",
                      puja: "🪔",
                      move_in: "📦",
                      project_completion: "✅",
                      custom: "📅",
                      other: "📅",
                    };
                    const label = getImportantDateDisplayTitle(date);

                    return (
                      <div
                        key={date.id || `date-${index}`}
                        className="p-4 bg-gray-50 rounded-xl flex items-center justify-between group gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-2xl shrink-0">
                            {icons[typeKey] || icons.custom}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {label}
                              {date.isRecurring && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Recurring
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(date.date).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            {date.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic truncate">
                                "{date.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                        {date.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditImportantDateModal(date)}
                              disabled={isSaving}
                              className="p-2 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                              title="Edit date"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void confirmDeleteImportantDate(date.id!)
                              }
                              disabled={isSaving}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Delete date"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-gray-500 text-sm">
                    No important dates added
                  </p>
                  <Button
                    type="button"
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={openAddImportantDateModal}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Date
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === "referrals" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  Referrals
                  {apiReferrals.length > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
                      {apiReferrals.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-3 h-3" />
                  Add Referral
                </button>
              </div>

              {loadingReferrals ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm text-gray-400">
                  <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  Loading referrals…
                </div>
              ) : apiReferrals.length > 0 ? (
                <div className="space-y-3">
                  {apiReferrals.map((lead: any, index: number) => {
                    const name = lead?.name || "Unnamed Lead";
                    const statusRaw = (lead?.status || "PENDING").toUpperCase();
                    const statusLabel =
                      statusRaw === "CONVERTED"
                        ? "Converted"
                        : statusRaw === "CONTACTED"
                          ? "Contacted"
                          : statusRaw === "NEW"
                            ? "New"
                            : statusRaw
                                .toLowerCase()
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c: string) =>
                                  c.toUpperCase(),
                                );
                    const statusColor =
                      statusRaw === "CONVERTED"
                        ? {
                            bg: "bg-green-50",
                            text: "text-green-700",
                            dot: "bg-green-500",
                          }
                        : statusRaw === "CONTACTED"
                          ? {
                              bg: "bg-blue-50",
                              text: "text-blue-700",
                              dot: "bg-blue-500",
                            }
                          : {
                              bg: "bg-gray-100",
                              text: "text-gray-600",
                              dot: "bg-gray-400",
                            };
                    return (
                      <div
                        key={lead?.id || index}
                        className="p-4 bg-gray-50/80 rounded-xl flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                              {lead?.phone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead?.email && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </span>
                              )}
                              {lead?.city && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {lead.city}
                                </span>
                              )}
                            </div>
                            {lead?.createdAt && (
                              <p className="text-xs text-gray-400 mt-1">
                                Referred{" "}
                                {new Date(lead.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                          />
                          {statusLabel}
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
            </div>
          )}

          {activeTab === "notes" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Notes
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "notes") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("notes");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "notes"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "notes" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "notes" ? "Save" : "Edit"}
                </button>
              </div>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-3">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span className="font-medium">{note.createdBy}</span>
                        <span>&middot;</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
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
              {editingTab === "notes" && (
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
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider">
                  Client Ranking
                </h3>
                <button
                  onClick={() => {
                    if (editingTab === "ranking") {
                      setEditingTab(null);
                      toast.success("Changes saved!");
                    } else {
                      setEditingTab("ranking");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    editingTab === "ranking"
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {editingTab === "ranking" ? (
                    <Save className="w-3 h-3" />
                  ) : (
                    <Edit2 className="w-3 h-3" />
                  )}
                  {editingTab === "ranking" ? "Save" : "Edit"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["vip", "niche", "regular", "one-time"] as const).map(
                  (rank) => {
                    const isSelected = customer.clientRanking === rank;
                    const config = {
                      vip: {
                        color: "purple",
                        label: "VIP",
                        desc: "High-value client",
                      },
                      niche: {
                        color: "blue",
                        label: "Niche",
                        desc: "Specialized projects",
                      },
                      regular: {
                        color: "emerald",
                        label: "Regular",
                        desc: "Standard client",
                      },
                      "one-time": {
                        color: "gray",
                        label: "One-Time",
                        desc: "Single project",
                      },
                    };
                    const c = config[rank];
                    return (
                      <button
                        key={rank}
                        onClick={async () => {
                          if (editingTab === "ranking" && !isSaving) {
                            await handleSaveCustomer({ clientRanking: rank });
                            toast.success(`Client ranking updated to ${rank}`);
                          }
                        }}
                        disabled={editingTab !== "ranking" || isSaving}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-orange-400 bg-orange-50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                        } ${editingTab !== "ranking" || isSaving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <p className="text-sm font-bold text-gray-900 capitalize mb-0.5">
                          {c.label}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {c.desc}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
              {editingTab !== "ranking" && (
                <p className="text-xs font-medium text-gray-500 mt-4 text-center">
                  Click "Edit" to change ranking
                </p>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Assigned Projects
                </h3>
              </div>

              {/* Assigned Projects List */}
              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-500">Loading projects...</p>
                </div>
              ) : customerProjects && customerProjects.length > 0 ? (
                <div className="space-y-3">
                  {customerProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/dashboard/projects/${project.id}`)
                      }
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            project.status === "ACTIVE"
                              ? "bg-blue-100 text-blue-600"
                              : project.status === "COMPLETED"
                                ? "bg-green-100 text-green-600"
                                : project.status === "PAUSED"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {project.projectName ||
                              project.name ||
                              "Unnamed Project"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge
                              className={`text-xs ${
                                project.status === "ACTIVE"
                                  ? "bg-blue-100 text-blue-700"
                                  : project.status === "COMPLETED"
                                    ? "bg-green-100 text-green-700"
                                    : project.status === "PAUSED"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {project.status}
                            </Badge>
                            {project.currentStageCode && (
                              <span className="text-sm text-gray-500">
                                {project.currentStageCode}
                              </span>
                            )}
                            {project.totalValue && (
                              <span className="text-sm font-medium text-gray-700">
                                {formatCurrencyINR(project.totalValue)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No projects found for this customer
                  </p>
                </div>
              )}
            </div>
          )}

          {/* References Tab — Lead data retained after conversion */}
          {/* KYC Tab */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              {/* Hidden file input */}
              <input
                ref={kycFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleKycFileChange}
              />

              {/* KYC Documents */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        KYC Documents
                      </h3>
                      <p className="text-xs text-gray-400">
                        Select document type and upload the file
                      </p>
                    </div>
                  </div>
                  {loadingKyc && (
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </div>

                {/* Single upload row */}
                <div className="flex items-center gap-3">
                  <select
                    value={kycUploadTarget ?? ""}
                    onChange={(e) => setKycUploadTarget(e.target.value || null)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-700"
                  >
                    <option value="">Select document type</option>
                    <option value="AADHAR">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="GST_CERTIFICATE">GST Certificate</option>
                  </select>
                  <button
                    onClick={() => {
                      if (kycUploadTarget) kycFileInputRef.current?.click();
                    }}
                    disabled={!kycUploadTarget || !!kycUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
                  >
                    {kycUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Accepted: JPG, PNG, PDF · Max 10 MB
                </p>

                {/* Uploaded documents list */}
                {kycAttachments.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Uploaded
                    </p>
                    {kycAttachments.map((doc) => {
                      const label =
                        doc.attachmentType === "AADHAR"
                          ? "Aadhar Card"
                          : doc.attachmentType === "PAN"
                            ? "PAN Card"
                            : doc.attachmentType === "GST_CERTIFICATE"
                              ? "GST Certificate"
                              : doc.attachmentType;
                      const isDeleting = kycDeleting === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                        >
                          <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700">
                              {label}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {doc.fileName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleKycAction(doc, "view")}
                              className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                              title="View"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleKycDelete(doc)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              {isDeleting ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Bank Details
                      </h3>
                      <p className="text-xs text-gray-400">
                        Optional · For payment and refund processing
                      </p>
                    </div>
                  </div>
                  {!bankDetailsEditing && (
                    <button
                      onClick={() => setBankDetailsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {bankDetails.trim() ? "Edit" : "Add"}
                    </button>
                  )}
                </div>

                {bankDetailsEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Bank Details
                        <span className="ml-1 text-gray-400 font-normal">
                          (e.g. HDFC Bank, Acc: 123456789, IFSC: HDFC0001234)
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        value={bankDetails}
                        onChange={(e) => setBankDetails(e.target.value)}
                        placeholder="Enter bank name, account number, IFSC code, branch..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveBankDetails}
                        disabled={bankDetailsSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
                      >
                        {bankDetailsSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setBankDetailsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : bankDetails.trim() ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {bankDetails}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      No bank details added yet
                    </p>
                    <button
                      onClick={() => setBankDetailsEditing(true)}
                      className="mt-3 text-xs text-orange-500 hover:text-orange-600 font-medium"
                    >
                      + Add bank details
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === "references" ||
            (activeTab === "overview" && customerData?.leadId)) && (
            <div className="space-y-6">
              {loadingLeadReferences ? (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-500">Loading lead references...</p>
                </div>
              ) : !customerData?.leadId ? (
                <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No lead reference data
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    This customer was not converted from a lead.
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <>
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700">
                              Lead Reference Data
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Update lead-origin details for this customer.
                              Changes are saved through lead update API.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {leadReferenceEditing && (
                              <button
                                onClick={handleCancelLeadReferenceEdit}
                                disabled={leadReferenceSaving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={
                                leadReferenceEditing
                                  ? handleSaveLeadReference
                                  : handleStartLeadReferenceEdit
                              }
                              disabled={
                                leadReferenceSaving ||
                                (!leadReferenceEditing &&
                                  !hasEditableLeadReferenceFields)
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                                leadReferenceEditing
                                  ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {leadReferenceSaving ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : leadReferenceEditing ? (
                                <Save className="w-3.5 h-3.5" />
                              ) : (
                                <Pencil className="w-3.5 h-3.5" />
                              )}
                              {leadReferenceEditing
                                ? "Save Lead Changes"
                                : "Edit Lead Data"}
                            </button>
                          </div>
                        </div>

                        {leadReferenceEditing && (
                          <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">
                            {!hasEditableLeadReferenceFields ? (
                              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                No currently visible lead fields are editable
                                for this customer.
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[
                                    "source",
                                    "status",
                                    "stage",
                                    "score",
                                    "priority",
                                    "companyName",
                                  ].map((field) =>
                                    renderLeadReferenceEditField(
                                      field as LeadReferenceEditableField,
                                    ),
                                  )}
                                </div>

                                {editableLeadReferenceFields.has("message") && (
                                  <div>
                                    <label className="text-xs text-gray-500 font-medium">
                                      Message / Requirements
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={leadReferenceEditForm.message}
                                      onChange={(e) =>
                                        updateLeadReferenceEditField(
                                          "message",
                                          e.target.value,
                                        )
                                      }
                                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
                                    />
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[
                                    "projectType",
                                    "propertyProjectType",
                                    "propertyType",
                                    "homeType",
                                    "bhkConfig",
                                    "area",
                                    "carpetArea",
                                    "city",
                                    "locality",
                                    "location",
                                    "projectStage",
                                    "projectScope",
                                  ].map((field) =>
                                    renderLeadReferenceEditField(
                                      field as LeadReferenceEditableField,
                                    ),
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[
                                    "budget",
                                    "budgetRange",
                                    "budgetComfort",
                                    "timeline",
                                    "startTimeline",
                                    "expectedStartDate",
                                    "moveinDate",
                                  ].map((field) =>
                                    renderLeadReferenceEditField(
                                      field as LeadReferenceEditableField,
                                    ),
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[
                                    "householdOrCompany",
                                    "budgetTier",
                                    "verificationAttempts",
                                  ].map((field) =>
                                    renderLeadReferenceEditField(
                                      field as LeadReferenceEditableField,
                                    ),
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {[
                                    "canWhatsApp",
                                    "wantsExperienceCenterVisit",
                                    "isPhoneVerified",
                                  ].map((field) =>
                                    renderLeadReferenceEditField(
                                      field as LeadReferenceEditableField,
                                    ),
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Lead Origin Info */}
                      <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-orange-600" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            Lead Information
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {leadReferenceData?.source && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                Source
                              </p>
                              <p className="text-sm font-medium text-gray-800 capitalize">
                                {String(leadReferenceData.source).replace(
                                  /_/g,
                                  " ",
                                )}
                              </p>
                            </div>
                          )}
                          {leadReferenceData?.status && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                Status
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  leadReferenceData.status === "CONVERTED"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {leadReferenceData.status}
                              </span>
                            </div>
                          )}
                          {leadReferenceData?.stage && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                Stage
                              </p>
                              <p className="text-sm font-medium text-gray-800 capitalize">
                                {String(leadReferenceData.stage).replace(
                                  /_/g,
                                  " ",
                                )}
                              </p>
                            </div>
                          )}
                          {leadReferenceData?.score !== undefined && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                Lead Score
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {leadReferenceData.score}
                              </p>
                            </div>
                          )}
                          {leadReferenceData?.priority && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                Priority
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  leadReferenceData.priority === "high"
                                    ? "bg-red-100 text-red-700"
                                    : leadReferenceData.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {leadReferenceData.priority}
                              </span>
                            </div>
                          )}
                          {leadReferenceData?.createdAt && (
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">
                                Lead Created
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {new Date(
                                  leadReferenceData.createdAt,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                        {(leadReferenceData?.message ||
                          leadReferenceData?.requirements ||
                          leadReferenceData?.notes) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-1">
                              Message / Requirements
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {leadReferenceData.message ||
                                leadReferenceData.requirements ||
                                leadReferenceData.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Project Requirements */}
                      {(leadReferenceData?.projectType ||
                        leadReferenceData?.propertyType ||
                        leadReferenceData?.bhkConfig ||
                        leadReferenceData?.carpetArea ||
                        leadReferenceData?.location ||
                        leadReferenceData?.city ||
                        leadReferenceData?.locality ||
                        leadReferenceData?.homeType ||
                        leadReferenceData?.propertyProjectType ||
                        leadReferenceData?.projectScope ||
                        leadReferenceData?.projectStage ||
                        leadReferenceData?.area) && (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Home className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Project Requirements
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {leadReferenceData?.projectType && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Project Type
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.projectType}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.propertyProjectType && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Property / Project Type
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.propertyProjectType}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.propertyType && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Property Type
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.propertyType}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.homeType && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Home Type
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.homeType}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.bhkConfig && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  BHK Config
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.bhkConfig}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.carpetArea && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Carpet Area
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.carpetArea} sq.ft
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.area && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Area
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.area} sq.ft
                                </p>
                              </div>
                            )}
                            {(leadReferenceData?.city ||
                              leadReferenceData?.locality ||
                              leadReferenceData?.location) && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Location
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {[
                                    leadReferenceData.locality,
                                    leadReferenceData.city,
                                    leadReferenceData.location,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.projectStage && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Project Stage
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.projectStage}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.projectScope && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Project Scope
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.projectScope}
                                </p>
                              </div>
                            )}
                          </div>
                          {leadReferenceData?.scopeOfWork &&
                            leadReferenceData.scopeOfWork.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 mb-2">
                                  Scope of Work
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {leadReferenceData.scopeOfWork.map(
                                    (item, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                                      >
                                        {item}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          {leadReferenceData?.servicesInterested &&
                            leadReferenceData.servicesInterested.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-2">
                                  Services Interested
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {leadReferenceData.servicesInterested.map(
                                    (item, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
                                      >
                                        {item}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Budget & Timeline */}
                      {(leadReferenceData?.budget ||
                        leadReferenceData?.budgetRange ||
                        leadReferenceData?.budgetComfort ||
                        leadReferenceData?.timeline ||
                        leadReferenceData?.startTimeline ||
                        leadReferenceData?.expectedStartDate ||
                        leadReferenceData?.moveinDate) && (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Budget & Timeline
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {leadReferenceData?.budget && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Budget
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.budget}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.budgetRange && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Budget Range
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.budgetRange}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.budgetComfort && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Budget Comfort
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.budgetComfort}
                                </p>
                              </div>
                            )}
                            {(leadReferenceData?.timeline ||
                              leadReferenceData?.startTimeline) && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Timeline
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.timeline ||
                                    leadReferenceData.startTimeline}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.expectedStartDate && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Expected Start
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {new Date(
                                    leadReferenceData.expectedStartDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.moveinDate && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Move-in Date
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {new Date(
                                    leadReferenceData.moveinDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Design Preferences */}
                      {(leadReferenceData?.designStyle?.length ||
                        leadReferenceData?.colorPreferences?.length ||
                        leadReferenceData?.serviceInterest) && (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Layers className="w-4 h-4 text-purple-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Design Preferences
                            </h3>
                          </div>
                          {leadReferenceData?.serviceInterest && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-400 mb-0.5">
                                Service Interest
                              </p>
                              <p className="text-sm font-medium text-gray-800">
                                {leadReferenceData.serviceInterest}
                              </p>
                            </div>
                          )}
                          {leadReferenceData?.designStyle &&
                            leadReferenceData.designStyle.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-400 mb-2">
                                  Design Style
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {leadReferenceData.designStyle.map((s, i) => (
                                    <span
                                      key={i}
                                      className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          {leadReferenceData?.colorPreferences &&
                            leadReferenceData.colorPreferences.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-2">
                                  Color Preferences
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {leadReferenceData.colorPreferences.map(
                                    (c, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-medium"
                                      >
                                        {c}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Referral Info */}
                      {(leadReferenceData?.referrerName ||
                        leadReferenceData?.referrerPhone ||
                        leadReferenceData?.referrerProjectNumber ||
                        leadReferenceData?.agentAgencyName) && (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                              <UserPlus className="w-4 h-4 text-teal-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Referral Source
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {leadReferenceData?.referrerName && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Referrer Name
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.referrerName}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.referrerPhone && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Referrer Phone
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.referrerPhone}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.referrerProjectNumber && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Project Number
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.referrerProjectNumber}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.agentAgencyName && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Agent / Agency
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.agentAgencyName}
                                </p>
                              </div>
                            )}
                            {leadReferenceData?.agentAgencyDetails && (
                              <div className="col-span-2">
                                <p className="text-xs text-gray-400 mb-0.5">
                                  Agency Details
                                </p>
                                <p className="text-sm font-medium text-gray-800">
                                  {leadReferenceData.agentAgencyDetails}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {additionalLeadReferenceFields.length > 0 && (
                        <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Info className="w-4 h-4 text-amber-700" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                              Additional Lead Details
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {additionalLeadReferenceFields.map(
                              ({ key, value }) => {
                                const isJsonObject =
                                  typeof value === "object" &&
                                  value !== null &&
                                  !Array.isArray(value);
                                const isStringValue = typeof value === "string";
                                const isUrlValue =
                                  isStringValue && isHttpUrl(value);

                                return (
                                  <div key={key}>
                                    <p className="text-xs text-gray-400 mb-0.5">
                                      {formatLeadReferenceLabel(key)}
                                    </p>
                                    {isJsonObject ? (
                                      <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
                                        {formatLeadReferenceValue(value)}
                                      </pre>
                                    ) : isUrlValue ? (
                                      <a
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline break-all"
                                        title="Open attached file"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{getFileNameFromUrl(value)}</span>
                                      </a>
                                    ) : (
                                      <p className="text-sm font-medium text-gray-800 break-words">
                                        {formatLeadReferenceValue(value)}
                                      </p>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "references" && (
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <File className="w-4 h-4 text-gray-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Uploaded References
                        </h3>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {leadAttachments.length} file
                          {leadAttachments.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Upload Reference File
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={referenceUploadTitle}
                              onChange={(e) =>
                                setReferenceUploadTitle(e.target.value)
                              }
                              placeholder="Enter reference title"
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              File
                            </label>
                            <input
                              ref={leadReferenceUploadInputRef}
                              type="file"
                              onChange={(e) =>
                                setReferenceUploadFile(
                                  e.target.files?.[0] ?? null,
                                )
                              }
                              className="block w-full text-xs text-gray-600 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white file:text-gray-700 border border-gray-200 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-gray-400 truncate">
                            {referenceUploadFile
                              ? `Selected: ${referenceUploadFile.name}`
                              : "No file selected"}
                          </p>
                          <button
                            onClick={handleUploadLeadReference}
                            disabled={
                              !referenceUploadFile || uploadingReference
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                          >
                            {uploadingReference ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                Upload
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {leadAttachments.length === 0 ? (
                        <div className="text-center py-8">
                          <File className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            No documents uploaded during the lead phase
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {leadAttachments.map((attachment) => {
                            const isImage =
                              attachment.fileType?.startsWith("image/");
                            const isPdf =
                              attachment.fileType === "application/pdf";
                            const isViewLoading =
                              attachmentLoading?.id === attachment.id &&
                              attachmentLoading.action === "view";
                            const isDownloadLoading =
                              attachmentLoading?.id === attachment.id &&
                              attachmentLoading.action === "download";
                            const fileSizeKB = attachment.fileSize
                              ? attachment.fileSize > 1024 * 1024
                                ? `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                : `${(attachment.fileSize / 1024).toFixed(0)} KB`
                              : null;

                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                              >
                                {/* Icon */}
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isImage
                                      ? "bg-blue-100"
                                      : isPdf
                                        ? "bg-red-100"
                                        : "bg-gray-200"
                                  }`}
                                >
                                  {isImage ? (
                                    <Image className="w-5 h-5 text-blue-600" />
                                  ) : isPdf ? (
                                    <FileText className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <File className="w-5 h-5 text-gray-600" />
                                  )}
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {attachment.fileName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-400 capitalize">
                                      {attachment.attachmentType
                                        ?.replace(/_/g, " ")
                                        .toLowerCase()}
                                    </span>
                                    {fileSizeKB && (
                                      <>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-xs text-gray-400">
                                          {fileSizeKB}
                                        </span>
                                      </>
                                    )}
                                    {(attachment.uploadedAt ||
                                      attachment.createdAt) && (
                                      <>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-xs text-gray-400">
                                          {new Date(
                                            attachment.uploadedAt ||
                                              attachment.createdAt ||
                                              "",
                                          ).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {attachment.notes && (
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                      {attachment.notes}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      handleAttachmentAction(attachment, "view")
                                    }
                                    disabled={!!attachmentLoading}
                                    className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                    title="View"
                                  >
                                    {isViewLoading ? (
                                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <ExternalLink className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAttachmentAction(
                                        attachment,
                                        "download",
                                      )
                                    }
                                    disabled={!!attachmentLoading}
                                    className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                    title="Download"
                                  >
                                    {isDownloadLoading ? (
                                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Family Member Modal */}
      {showFamilyModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowFamilyModal(false);
                setEditingMember(null);
                resetFamilyForm();
              }}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-orange-500" />
                {editingMember ? "Edit Family Member" : "Add Family Member"}
              </h3>
              <div className="space-y-4">
                {/* First Name + Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={familyForm.firstName}
                      onChange={(e) =>
                        setFamilyForm({
                          ...familyForm,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={familyForm.lastName}
                      onChange={(e) =>
                        setFamilyForm({
                          ...familyForm,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Relationship */}
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
                    {relationshipTypes.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={familyForm.dateOfBirth}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={familyForm.phone}
                      onChange={(e) =>
                        setFamilyForm({ ...familyForm, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+91..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={familyForm.email}
                      onChange={(e) =>
                        setFamilyForm({ ...familyForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={familyForm.occupation}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        occupation: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Doctor, Engineer"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={familyForm.notes}
                    onChange={(e) =>
                      setFamilyForm({ ...familyForm, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Any additional notes"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowFamilyModal(false);
                    setEditingMember(null);
                    resetFamilyForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingMember ? handleUpdateFamily : handleAddFamily}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={
                    !familyForm.firstName ||
                    !familyForm.relationship ||
                    isSaving
                  }
                >
                  {isSaving
                    ? editingMember
                      ? "Saving..."
                      : "Adding..."
                    : editingMember
                      ? "Save Changes"
                      : "Add Member"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Important Date Modal */}
      {showDateModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeDateModal}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-orange-500" />
                {editingImportantDate
                  ? "Edit Important Date"
                  : "Add Important Date"}
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={dateForm.dateType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setDateForm((prev) => ({
                        ...prev,
                        dateType: nextType,
                        customLabel:
                          nextType === "CUSTOM" ? prev.customLabel : "",
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {IMPORTANT_DATE_TYPE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                    {dateForm.dateType &&
                      !IMPORTANT_DATE_TYPE_OPTIONS.some(
                        (o) => o.value === dateForm.dateType,
                      ) && (
                        <option value={dateForm.dateType}>
                          {getImportantDateTypeLabel(dateForm.dateType)}
                        </option>
                      )}
                  </select>
                </div>
                {dateForm.dateType === "CUSTOM" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom label *
                    </label>
                    <input
                      type="text"
                      value={dateForm.customLabel}
                      onChange={(e) =>
                        setDateForm({
                          ...dateForm,
                          customLabel: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. Birthday"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    max={formatLocalDateYMD(new Date())}
                    value={dateForm.date}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can select today or a past date only.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={dateForm.isRecurring}
                      onChange={(e) =>
                        setDateForm({
                          ...dateForm,
                          isRecurring: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label
                      htmlFor="isRecurring"
                      className="text-sm font-medium text-gray-700"
                    >
                      Recurring (Annually)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dateForm.reminderDays}
                    onChange={(e) =>
                      setDateForm({
                        ...dateForm,
                        reminderDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Days before the date to send a reminder
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={dateForm.notes}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
                    placeholder="e.g., Send flowers"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="sm:min-w-[7rem]">
                  {editingImportantDate?.id ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDeleteImportantDate}
                      disabled={isSaving}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5 inline-block align-middle" />
                      Delete
                    </Button>
                  ) : null}
                </div>
                <div className="flex gap-3 flex-1 sm:justify-end">
                  <Button
                    variant="secondary"
                    onClick={closeDateModal}
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial sm:min-w-[7rem]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveImportantDate}
                    className="flex-1 sm:flex-initial sm:min-w-[8rem] bg-orange-500 hover:bg-orange-600"
                    disabled={
                      !dateForm.dateType ||
                      !dateForm.date ||
                      isSaving ||
                      (dateForm.dateType === "CUSTOM" &&
                        !dateForm.customLabel.trim()) ||
                      dateForm.date > formatLocalDateYMD(new Date())
                    }
                  >
                    {isSaving
                      ? editingImportantDate
                        ? "Saving..."
                        : "Adding..."
                      : editingImportantDate
                        ? "Save changes"
                        : "Add Date"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Referral Modal */}
      {showReferralModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowReferralModal(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-orange-500" />
                Add Referral
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Lead *
                  </label>
                  {loadingLeads ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-400">
                      Loading leads…
                    </div>
                  ) : (
                    <select
                      value={referralForm.leadId}
                      onChange={(e) =>
                        setReferralForm({ leadId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="">-- Choose a lead --</option>
                      {allLeads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name || "Unnamed Lead"}
                          {lead.phone ? ` · ${lead.phone}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowReferralModal(false);
                    setReferralForm({ leadId: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddReferral}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={!referralForm.leadId}
                >
                  Add Referral
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Add Note Modal */}
      {showNoteModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNoteModal(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <StickyNote className="w-6 h-6 text-orange-500" />
                Add Note
              </h3>
              <div className="space-y-6">
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
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
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
                  ? This will permanently remove the customer and all associated
                  data.
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
          </div>,
          document.body,
        )}
    </div>
  );
};
