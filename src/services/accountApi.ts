// Account API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.goodhomestory.com";

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
  id: string;
  name: string;
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
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Get all account types
 * GET /api/accounts/types
 */
export async function getAccountTypes(): Promise<AccountType[]> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/types`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<AccountType[]>(response);
}

/**
 * Convert Lead to Account
 * POST /api/accounts/convert-lead
 */
export async function convertLeadToAccount(
  leadId: string,
  name: string,
): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/convert-lead`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ leadId, name }),
  });

  return handleResponse<Account>(response);
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
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.type) queryParams.append("type", params.type);
    if (params.status) queryParams.append("status", params.status);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
  }

  const url = `${API_BASE_URL}/api/accounts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Create a new account
 * POST /api/accounts
 */
export async function createAccount(
  account: Omit<Account, "id">,
): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/api/accounts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(account),
  });

  return handleResponse<Account>(response);
}

/**
 * Get an account by ID
 * GET /api/accounts/:id
 */
export async function getAccountById(id: string): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<Account>(response);
}

/**
 * Update an account
 * PUT /api/accounts/:id
 */
export async function updateAccount(
  id: string,
  updates: Partial<Account>,
): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  return handleResponse<Account>(response);
}

/**
 * Delete an account
 * DELETE /api/accounts/:id
 */
export async function deleteAccount(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/accounts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to delete account" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
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
