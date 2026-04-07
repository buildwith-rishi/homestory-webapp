import React, { useState } from "react";
import { Plus, Users, Search } from "lucide-react";
import type { Contact } from "../../services/contactApi";
import ContactAPI from "../../services/contactApi";
import { ContactCard } from "./ContactCard";
import { AddContactModal } from "./AddContactModal";
import { EditContactModal } from "./EditContactModal";
import toast from "react-hot-toast";
import { SectionLoader } from "../ui";

interface ContactsListProps {
  leadId: string;
  contacts: Contact[];
  isLoading?: boolean;
  isEditable?: boolean;
  onContactsChanged: () => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({
  leadId,
  contacts,
  isLoading = false,
  isEditable = false,
  onContactsChanged,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sort contacts: primary first, then alphabetically
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Filter by search
  const filteredContacts = sortedContacts.filter((contact) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      contact.phone.includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  });

  const handleContactAdded = () => {
    setShowAddModal(false);
    onContactsChanged();
  };

  const handleContactUpdated = () => {
    setEditingContact(null);
    onContactsChanged();
  };

  const handleDeleteContact = async (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    const confirmMessage = contact
      ? `Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`
      : "Are you sure you want to delete this contact?";

    if (!window.confirm(confirmMessage)) return;

    setDeletingId(contactId);
    try {
      await ContactAPI.deleteContact(contactId);
      toast.success("Contact deleted successfully");
      onContactsChanged();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete contact";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return <SectionLoader message="Loading contacts..." size="sm" />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        {contacts.length > 0 && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        {/* Add button */}
        {isEditable && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        )}
      </div>

      {/* Contacts grid */}
      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={deletingId === contact.id ? "opacity-50" : ""}
            >
              <ContactCard
                contact={contact}
                isEditable={isEditable}
                onEdit={(c) => setEditingContact(c)}
                onDelete={handleDeleteContact}
              />
            </div>
          ))}
        </div>
      ) : contacts.length > 0 && searchQuery ? (
        // No results for search
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No contacts match your search</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No contacts added yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Add contacts to keep track of key people
          </p>
          {isEditable && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Contact
            </button>
          )}
        </div>
      )}

      {/* Contact count */}
      {contacts.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {filteredContacts.length === contacts.length
            ? `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`
            : `${filteredContacts.length} of ${contacts.length} contacts`}
        </div>
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        leadId={leadId}
        onContactAdded={handleContactAdded}
      />

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          isOpen={true}
          onClose={() => setEditingContact(null)}
          contact={editingContact}
          onContactUpdated={handleContactUpdated}
        />
      )}
    </div>
  );
};

export default ContactsList;
