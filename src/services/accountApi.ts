// Account API Service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log('Account API Base URL:', API_BASE_URL);

export interface Account {
  id: string;
  name: string;
  type?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  description?: string;
  revenue?: string;
  employees?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  leadId?: string;
}

export interface AccountType {
  value: string;
  label: string;
  description?: string;
}

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
      // If response is not JSON, use status text
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
 * Get all account types
 * GET /api/accounts/types
 */
export async function getAccountTypes(): Promise<AccountType[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/accounts/types`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<{ types: AccountType[] }>(response);
    return data.types || [];
  } catch (error) {
    console.error("Error fetching account types:", error);
    throw error;
  }
}

/**
 * Convert Lead to Account
 * POST /api/accounts/convert-lead
 * Payload: { leadId: string, name: string }
 */
export async function convertLeadToAccount(
  leadId: string,
  name: string,
): Promise<Account> {
  try {
    const payload = { leadId, name };
    console.log("Converting lead to account:");
    console.log("API URL:", `${API_BASE_URL}/api/accounts/convert-lead`);
    console.log("Payload:", payload);
    
    const response = await fetch(`${API_BASE_URL}/api/accounts/convert-lead`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const account = await handleResponse<Account>(response);
    console.log("Lead converted successfully:", account);
    return account;
  } catch (error) {
    console.error("Error converting lead to account:", error);
    throw error;
  }
}

/**
 * List all accounts with optional filters
 * GET /api/accounts
 */
export async function listAccounts(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  accounts: Account[];
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
    }

    const url = `${API_BASE_URL}/api/accounts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    console.log("Fetching accounts:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<{
      accounts: Account[];
      total: number;
      page: number;
      limit: number;
    }>(response);
    
    console.log("Accounts fetched:", data);
    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
}

/**
 * Create a new account
 * POST /api/accounts
 */
export async function createAccount(
  account: Omit<Account, "id">,
): Promise<Account> {
  try {
    console.log("Creating account:", account);
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(account),
    });

    const newAccount = await handleResponse<Account>(response);
    console.log("Account created successfully:", newAccount);
    return newAccount;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

/**
 * Get an account by ID
 * GET /api/accounts/:id
 */
export async function getAccountById(id: string): Promise<Account> {
  try {
    console.log("Fetching account by ID:", id);
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const account = await handleResponse<Account>(response);
    console.log("Account fetched:", account);
    return account;
  } catch (error) {
    console.error("Error fetching account:", error);
    throw error;
  }
}

/**
 * Update an account
 * PUT /api/accounts/:id
 */
export async function updateAccount(
  id: string,
  updates: Partial<Account>,
): Promise<Account> {
  try {
    console.log("Updating account:", id, updates);
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const updatedAccount = await handleResponse<Account>(response);
    console.log("Account updated successfully:", updatedAccount);
    return updatedAccount;
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
}

/**
 * Delete an account
 * DELETE /api/accounts/:id
 */
export async function deleteAccount(id: string): Promise<void> {
  try {
    console.log("Deleting account:", id);
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete account. Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    console.log("Account deleted successfully");
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}

// Default export with all functions
const AccountAPI = {
  getAccountTypes,
  convertLeadToAccount,
  listAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
};

export default AccountAPI;
