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
  title: string;
  date: string;
  type?: string;
}

export interface ConvertedFromLead {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status?: string;
}

export interface Customer {
  id: string;
  name: string;
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
  status?: string;
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
