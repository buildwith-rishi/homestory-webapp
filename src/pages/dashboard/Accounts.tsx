import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  DollarSign,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import toast from "react-hot-toast";
import AccountAPI, { Account, AccountType } from "../../services/accountApi";

// Add/Edit Account Modal Component
const AccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  onSave: (account: Omit<Account, "id">) => Promise<void>;
  accountTypes: AccountType[];
}> = ({ isOpen, onClose, account, onSave, accountTypes }) => {
  const [formData, setFormData] = useState<Omit<Account, "id">>({
    name: "",
    type: "",
    industry: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    revenue: "",
    employees: undefined,
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || "",
        type: account.type || "",
        industry: account.industry || "",
        phone: account.phone || "",
        email: account.email || "",
        website: account.website || "",
        address: account.address || "",
        city: account.city || "",
        state: account.state || "",
        country: account.country || "",
        postalCode: account.postalCode || "",
        revenue: account.revenue || "",
        employees: account.employees,
        description: account.description || "",
      });
    } else {
      setFormData({
        name: "",
        type: "",
        industry: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        revenue: "",
        employees: undefined,
        description: "",
      });
    }
    setErrors({});
  }, [account, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Account name is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone))
      newErrors.phone = "Invalid phone format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    console.log("Submitting account data:", formData);

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
      toast.success(
        account
          ? "Account updated successfully!"
          : "Account created successfully!",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save account";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {account ? "Edit Account" : "Add New Account"}
              </h2>
              <p className="text-sm text-gray-600">
                {account
                  ? "Update account information"
                  : "Fill in the account details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Account Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Sharma Family"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.name}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">Select Type</option>
                {accountTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="e.g., Real Estate"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@example.com"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                  errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Street address"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="e.g., Bangalore"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="e.g., Karnataka"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="e.g., India"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) =>
                  setFormData({ ...formData, postalCode: e.target.value })
                }
                placeholder="e.g., 560001"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Revenue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Annual Revenue
              </label>
              <input
                type="text"
                value={formData.revenue}
                onChange={(e) =>
                  setFormData({ ...formData, revenue: e.target.value })
                }
                placeholder="e.g., ₹50L"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Employees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Employees
              </label>
              <input
                type="number"
                value={formData.employees || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employees: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g., 50"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add any additional notes about this account..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {account ? "Update Account" : "Create Account"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Main Accounts Page Component
export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsData, typesData] = await Promise.all([
        AccountAPI.listAccounts(),
        AccountAPI.getAccountTypes(),
      ]);

      console.log("API Response:", { accountsData, typesData });

      setAccounts(accountsData.accounts || []);
      setAccountTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load accounts data";
      toast.error(errorMessage);
      setAccounts([]);
      setAccountTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Create Account
  const handleCreateAccount = async (accountData: Omit<Account, "id">) => {
    try {
      const newAccount = await AccountAPI.createAccount(accountData);

      const accountWithData = {
        ...accountData,
        ...newAccount,
        name: newAccount.name || accountData.name,
      };

      setAccounts([accountWithData, ...accounts]);
      setShowAddModal(false);
      toast.success("Account created successfully!");
      fetchData();
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  };

  // Update Account
  const handleUpdateAccount = async (accountData: Omit<Account, "id">) => {
    if (!accountToEdit?.id) return;

    try {
      const updatedAccount = await AccountAPI.updateAccount(
        accountToEdit.id,
        accountData,
      );
      setAccounts(
        accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
      );
      setShowEditModal(false);
      setAccountToEdit(null);
      toast.success("Account updated successfully!");
    } catch (error) {
      console.error("Error updating account:", error);
      throw error;
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await AccountAPI.deleteAccount(id);
      setAccounts(accounts.filter((a) => a.id !== id));
      toast.success("Account deleted successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete account";
      toast.error(errorMessage);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (account.name?.toLowerCase() || "").includes(searchLower) ||
      (account.email?.toLowerCase() || "").includes(searchLower) ||
      (account.phone?.toLowerCase() || "").includes(searchLower) ||
      (account.industry?.toLowerCase() || "").includes(searchLower);
    const matchesType = selectedType === "all" || account.type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer accounts and organizations
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={fetchData}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/25"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search accounts by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              {accountTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Accounts</p>
              <p className="text-3xl font-bold mt-1">{accounts.length}</p>
            </div>
            <Building2 className="w-10 h-10 opacity-80" />
          </div>
        </Card>

        {accountTypes.slice(0, 3).map((type, index) => {
          const count = accounts.filter((a) => a.type === type.name).length;
          const colors = [
            "from-blue-500 to-blue-600",
            "from-purple-500 to-purple-600",
            "from-green-500 to-green-600",
          ];
          return (
            <Card
              key={type.id}
              className={`p-5 bg-gradient-to-br ${colors[index]} text-white rounded-xl shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">{type.name}</p>
                  <p className="text-3xl font-bold mt-1">{count}</p>
                </div>
                <Building2 className="w-10 h-10 opacity-80" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAccounts.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No accounts found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery || selectedType !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first account to get started"}
            </p>
          </Card>
        ) : (
          filteredAccounts.map((account) => (
            <Card
              key={account.id}
              className="p-5 rounded-xl hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                    {(account.name || "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {account.name}
                    </h3>
                    {account.type && (
                      <Badge className="text-xs rounded-lg mt-1 bg-orange-100 text-orange-700 border-orange-200">
                        {account.type}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="relative group/menu">
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAccountToEdit(account);
                        setShowEditModal(true);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-gray-50 rounded-t-xl transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 rounded-b-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {account.industry && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{account.industry}</span>
                  </div>
                )}
                {account.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{account.email}</span>
                  </div>
                )}
                {account.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{account.phone}</span>
                  </div>
                )}
                {account.website && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span className="truncate">{account.website}</span>
                  </div>
                )}
                {(account.city || account.state) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[account.city, account.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {account.revenue && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>{account.revenue}</span>
                  </div>
                )}
                {account.employees && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{account.employees} employees</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <AccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateAccount}
        accountTypes={accountTypes}
      />

      <AccountModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setAccountToEdit(null);
        }}
        account={accountToEdit}
        onSave={handleUpdateAccount}
        accountTypes={accountTypes}
      />
    </div>
  );
}
