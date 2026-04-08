// Consolidated Customer Type Definitions
// This is the single source of truth for all customer-related types

export interface CustomerOwner {
  id: string;
  name: string;
  email: string;
}

export interface CustomerContact {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
  designation?: string | null;
  department?: string | null;
  leadId?: string | null;
  accountId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProject {
  id: string;
  name: string;
  status?: string;
  progress?: number;
}

export interface CustomerFamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: string | null;
  occupation?: string | null;
}

export interface CustomerImportantDate {
  id: string;
  dateType: string;
  date: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
  /** When `dateType` is CUSTOM, user-defined label sent to the API. */
  customLabel?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConvertedFromLead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status?: string;
  [key: string]: unknown;
}

export interface Customer {
  id: string;
  customerNumber?: string;
  name: string;
  type?: string;
  bankDetails?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryEmails?: string[];
  secondaryPhones?: string[];
  taxId?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  status?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  notes?: string | null;
  ownerId?: string | null;
  convertedFromLeadId?: string | null;
  referralCode?: string | null;
  referredByAccountId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: CustomerOwner | null;
  _count?: {
    contacts: number;
    projects: number;
  };
  // Nested data from GET /api/customers/:id
  contacts?: CustomerContact[];
  projects?: CustomerProject[];
  familyMembers?: CustomerFamilyMember[];
  importantDates?: CustomerImportantDate[];
  convertedFromLead?: ConvertedFromLead | null;
  /** Company / org name (may also appear under uiIntake) */
  companyName?: string | null;
  occupation?: string | null;
  /** Intake snapshot from create-customer flow or CRM */
  uiIntake?: Record<string, unknown> | null;
  /** PUT /api/customers — project / intake fields (may be top-level on account) */
  propertyType?: string | null;
  projectType?: string | null;
  area?: number | string | null;
  city?: string | null;
  projectStage?: string | null;
  startTimeline?: string | null;
  budgetComfort?: string | null;
  projectScope?: string | null;
  requirements?: string | null;
  floorPlanUrl?: string | null;
}

export interface CustomerType {
  value: string;
  label: string;
  description?: string;
}

export interface CustomerStatus {
  value: string;
  label: string;
  description?: string;
}

// Search Customer Response Types
export interface SearchCustomerLead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  source: string;
  isPhoneVerified: boolean;
  assignedTo?: string | null;
  projectCount: number;
  recentProjects: any[];
}

export interface SearchCustomerAccount {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface SearchCustomerResponse {
  found: boolean;
  lead?: SearchCustomerLead;
  account?: SearchCustomerAccount;
}

export interface SearchCustomerParams {
  email?: string;
  phone?: string;
}
