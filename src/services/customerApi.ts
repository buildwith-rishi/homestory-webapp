// Customer API Service (replaces Account API - accounts are now customers)
import type {
  Customer,
  CustomerType,
  CustomerStatus,
  CustomerImportantDate,
  SearchCustomerResponse,
  SearchCustomerParams,
} from "../types/customer";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

// Re-export types for backwards compatibility
export type {
  Customer,
  CustomerType,
  CustomerStatus,
  CustomerOwner,
  CustomerContact,
  CustomerProject,
  CustomerFamilyMember,
  CustomerImportantDate,
  ConvertedFromLead,
} from "../types/customer";

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (e) {
    throw new Error("Invalid JSON response from server");
  }
}

/**
 * Get all customer types
 * GET /api/customers/types
 */
export async function getCustomerTypes(): Promise<CustomerType[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers/types`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<{ types: CustomerType[] }>(response);
    return data.types || [];
  } catch (error) {
    console.error("Error fetching customer types:", error);
    throw error;
  }
}

/**
 * Get all customer statuses
 * GET /api/customers/statuses
 */
export async function getCustomerStatuses(): Promise<CustomerStatus[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers/statuses`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<{ statuses: CustomerStatus[] }>(response);
    return data.statuses || [];
  } catch (error) {
    console.error("Error fetching customer statuses:", error);
    throw error;
  }
}

/**
 * Convert Lead to Customer
 * POST /api/customers/convert-lead
 * Payload: { leadId: string, name: string }
 */
export async function convertLeadToCustomer(
  leadId: string,
  name: string,
): Promise<Customer> {
  try {
    const payload = { leadId, name };
    console.log("Converting lead to customer:", payload);

    const response = await fetch(`${API_BASE_URL}/api/customers/convert-lead`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await handleResponse<{ customer: Customer } | Customer>(
      response,
    );
    // Handle both wrapped and unwrapped response formats
    const customer =
      "customer" in data
        ? (data as { customer: Customer }).customer
        : (data as Customer);
    console.log("Lead converted successfully:", customer);
    return customer;
  } catch (error) {
    console.error("Error converting lead to customer:", error);
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("unique constraint") ||
        error.message.toLowerCase().includes("convertedFromLeadId") ||
        error.message.toLowerCase().includes("already been converted"))
    ) {
      throw new Error(
        "This lead has already been converted to a customer. Refresh the page to see the existing customer.",
      );
    }
    throw error;
  }
}

/**
 * List all customers with optional filters
 * GET /api/customers
 */
export async function listCustomers(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  includeContacts?: boolean;
}): Promise<{
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.type) queryParams.append("type", params.type);
      if (params.status) queryParams.append("status", params.status);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.includeContacts) queryParams.append("includeContacts", "true");
    }

    const url = `${API_BASE_URL}/api/customers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return await handleResponse<{
      customers: Customer[];
      total: number;
      page: number;
      limit: number;
    }>(response);
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
}

/**
 * Create a new customer
 * POST /api/customers
 */
export async function createCustomer(
  customer: Omit<Customer, "id">,
): Promise<Customer> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });

    const newCustomer = await handleResponse<Customer>(response);
    console.log("Customer created successfully:", newCustomer);
    return newCustomer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

/**
 * Get a customer by ID
 * GET /api/customers/:id
 */
export async function getCustomerById(id: string): Promise<Customer> {
  try {
    console.log("Fetching customer by ID:", id);
    console.log("API URL:", `${API_BASE_URL}/api/customers/${id}`);

    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("Response status:", response.status);
    const data = await handleResponse<{ customer: Customer }>(response);
    const customer = data.customer;
    console.log("Customer fetched successfully:", customer);
    return customer;
  } catch (error) {
    console.error("Error fetching customer by ID:", id, error);
    throw error;
  }
}

/**
 * Update a customer
 * PUT /api/customers/:id
 */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>,
): Promise<Customer> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await handleResponse<{ customer: Customer } | Customer>(
      response,
    );
    // Handle both wrapped and unwrapped response formats
    const updatedCustomer =
      "customer" in data
        ? (data as { customer: Customer }).customer
        : (data as Customer);
    console.log("Customer updated successfully:", updatedCustomer);
    return updatedCustomer;
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
}

/**
 * Delete a customer
 * DELETE /api/customers/:id
 */
export async function deleteCustomer(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete customer. Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    console.log("Customer deleted successfully");
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
}

/**
 * Get family relationship types
 * GET /api/family/relationship-types
 */
export async function getFamilyRelationshipTypes(): Promise<
  { value: string; label: string }[]
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/family/relationship-types`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const data = await handleResponse<{
      relationshipTypes: { value: string; label: string }[];
    }>(response);
    return data.relationshipTypes || [];
  } catch (error) {
    console.error("Error fetching relationship types:", error);
    // Fallback list so the UI doesn't break if the endpoint is unreachable
    return [
      { value: "SPOUSE", label: "Spouse" },
      { value: "CHILD", label: "Child" },
      { value: "PARENT", label: "Parent" },
      { value: "SIBLING", label: "Sibling" },
      { value: "GRANDPARENT", label: "Grandparent" },
      { value: "GRANDCHILD", label: "Grandchild" },
      { value: "IN_LAW", label: "In-Law" },
      { value: "OTHER", label: "Other" },
    ];
  }
}

export interface AddFamilyMemberPayload {
  firstName: string;
  lastName?: string;
  relationship: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  notes?: string;
}

export type UpdateFamilyMemberPayload = Partial<AddFamilyMemberPayload>;

/**
 * Update a family member
 * PUT /api/family/:familyMemberId
 */
export async function updateFamilyMember(
  familyMemberId: string,
  payload: UpdateFamilyMemberPayload,
): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/family/${familyMemberId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    );
    return await handleResponse<any>(response);
  } catch (error) {
    console.error("Error updating family member:", error);
    throw error;
  }
}

/**
 * Add a family member to a customer
 * POST /api/customers/:customerId/family
 */
export async function addFamilyMember(
  customerId: string,
  payload: AddFamilyMemberPayload,
): Promise<any> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/${customerId}/family`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    );
    return await handleResponse<any>(response);
  } catch (error) {
    console.error("Error adding family member:", error);
    throw error;
  }
}

/**
 * Search for an existing customer by contact information (email or phone)
 * GET /api/leads/search-customer?email=EMAIL or ?phone=PHONE
 * Returns: { found: boolean, lead: {...}, account: {...} }
 */
export async function searchCustomerByContact(
  params: SearchCustomerParams,
): Promise<SearchCustomerResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params.email) {
      queryParams.append("email", params.email);
    } else if (params.phone) {
      queryParams.append("phone", params.phone);
    } else {
      throw new Error("Either email or phone must be provided");
    }

    const url = `${API_BASE_URL}/api/leads/search-customer?${queryParams.toString()}`;
    console.log("Searching for customer:", params);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<SearchCustomerResponse>(response);
    console.log("Customer search result:", data);
    return data;
  } catch (error) {
    console.error("Error searching for customer:", error);
    throw error;
  }
}

// Add Important Date
export async function addImportantDate(
  customerId: string,
  dateData: {
    dateType: string;
    date: string;
    isRecurring?: boolean;
    reminderDays?: number;
    notes?: string;
    /** Required when `dateType` is CUSTOM (free-text label for the occasion). */
    customLabel?: string;
  },
): Promise<CustomerImportantDate> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/${customerId}/important-dates`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(dateData),
      },
    );

    const data = await handleResponse<
      { importantDate: CustomerImportantDate } | CustomerImportantDate
    >(response);

    return "importantDate" in data
      ? (data as { importantDate: CustomerImportantDate }).importantDate
      : (data as CustomerImportantDate);
  } catch (error) {
    console.error("Error adding important date:", error);
    throw error;
  }
}

// Get Important Dates
export async function getImportantDates(
  customerId: string,
): Promise<CustomerImportantDate[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/customers/${customerId}/important-dates`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<
      { importantDates: CustomerImportantDate[] } | CustomerImportantDate[]
    >(response);

    if (Array.isArray(data)) {
      return data;
    }
    return (
      (data as { importantDates: CustomerImportantDate[] }).importantDates || []
    );
  } catch (error) {
    console.error("Error fetching important dates:", error);
    throw error;
  }
}

/** PUT /api/important-dates/:id — update an existing important date */
export interface UpdateImportantDateInput {
  date?: string;
  dateType?: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
  customLabel?: string;
}

export async function updateImportantDate(
  id: string,
  data: UpdateImportantDateInput,
): Promise<CustomerImportantDate> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/important-dates/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );

    const dataOut = await handleResponse<
      { importantDate: CustomerImportantDate } | CustomerImportantDate
    >(response);

    return "importantDate" in dataOut
      ? (dataOut as { importantDate: CustomerImportantDate }).importantDate
      : (dataOut as CustomerImportantDate);
  } catch (error) {
    console.error("Error updating important date:", error);
    throw error;
  }
}

// ─── KYC & Bank Details ─────────────────────────────────────────────────────

export type KycDocType = "AADHAR" | "PAN" | "GST_CERTIFICATE";

export interface KycDocument {
  id: string;
  attachmentType: KycDocType;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  downloadUrl?: string;
  storageUrl?: string;
  fileUrl?: string;
  uploadedAt?: string;
  createdAt?: string;
}

/** POST /api/accounts/:id/kyc — Upload a KYC document as multipart/form-data */
export async function uploadKycDocument(
  accountId: string,
  file: File,
  attachmentType: KycDocType,
): Promise<KycDocument> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("attachmentType", attachmentType);

  const token = localStorage.getItem("auth_token");
  const response = await fetch(
    `${API_BASE_URL}/api/accounts/${accountId}/kyc`,
    {
      method: "POST",
      headers: {
        // Do NOT set Content-Type — browser sets it automatically with the correct boundary
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    },
  );
  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await response.json();
  return (data.document ?? data.attachment ?? data) as KycDocument;
}

/** GET /api/accounts/:id/kyc — Retrieve all KYC documents for an account */
export async function getKycDocuments(
  accountId: string,
): Promise<KycDocument[]> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(
    `${API_BASE_URL}/api/accounts/${accountId}/kyc`,
    {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    },
  );
  if (!response.ok) {
    if (response.status === 404) return [];
    let message = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await response.json();
  if (Array.isArray(data)) return data as KycDocument[];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.documents)) return obj.documents as KycDocument[];
  if (Array.isArray(obj.attachments)) return obj.attachments as KycDocument[];
  if (Array.isArray(obj.data)) return obj.data as KycDocument[];
  return [];
}

/** POST /api/accounts/:id/bank-details — Save bank details as a free-text string */
export async function saveBankDetailsApi(
  accountId: string,
  bankDetails: string,
): Promise<string> {
  const token = localStorage.getItem("auth_token");
  const url = `${API_BASE_URL}/api/accounts/${accountId}/bank-details`;

  // Some backend versions accept different property names.
  // Retry with known variants to avoid blocking users on API drift.
  const payloadVariants: Array<Record<string, string>> = [
    { bankDetails },
    { data: bankDetails },
    { details: bankDetails },
  ];

  let lastErrorMessage = "";

  for (const payload of payloadVariants) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        const data = await response.json();
        if (typeof data === "string") return data;
        const obj = data as Record<string, unknown>;
        if (typeof obj.bankDetails === "string") return obj.bankDetails;
        if (obj.account && typeof obj.account === "object") {
          const accountObj = obj.account as Record<string, unknown>;
          if (typeof accountObj.bankDetails === "string") {
            return accountObj.bankDetails;
          }
        }
        if (typeof obj.data === "string") return obj.data;
        if (
          obj.data &&
          typeof obj.data === "object" &&
          typeof (obj.data as Record<string, unknown>).bankDetails === "string"
        ) {
          return (obj.data as Record<string, unknown>).bankDetails as string;
        }
      } catch {
        // Ignore response parse issues and fall back to submitted value.
      }
      return bankDetails;
    }

    let message = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {}

    lastErrorMessage = message;
  }

  throw new Error(lastErrorMessage || "Failed to save bank details");
}

/** GET /api/accounts/:id/bank-details — Retrieve saved bank details string */
export async function getBankDetails(accountId: string): Promise<string> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(
    `${API_BASE_URL}/api/accounts/${accountId}/bank-details`,
    {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    },
  );
  if (!response.ok) {
    if (response.status === 404) return "";
    let message = `HTTP error ${response.status}`;
    try {
      const err = await response.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await response.json();
  if (typeof data === "string") return data;
  const obj = data as Record<string, unknown>;

  if (typeof obj.bankDetails === "string") return obj.bankDetails;
  if (typeof obj.data === "string") return obj.data;
  if (
    obj.data &&
    typeof obj.data === "object" &&
    typeof (obj.data as Record<string, unknown>).bankDetails === "string"
  ) {
    return (obj.data as Record<string, unknown>).bankDetails as string;
  }
  if (typeof obj.details === "string") return obj.details;

  return "";
}

// Default export with all functions
const CustomerAPI = {
  getCustomerTypes,
  getCustomerStatuses,
  convertLeadToCustomer,
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomerByContact,
  getFamilyRelationshipTypes,
  addImportantDate,
  getImportantDates,
  updateImportantDate,

  addFamilyMember,
  updateFamilyMember,
};

export default CustomerAPI;
