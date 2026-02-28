import React, { useState } from 'react';
import { X, User, Phone, Mail, Plus, Loader2, Briefcase } from 'lucide-react';
import { Button, Input } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createTeamMember } from '../../services/teamApi';

interface AddEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export interface NewEngineer {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  memberType: string;
}

const roleOptions = [
  'Lead Carpenter',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Mason',
  'Welder',
  'HVAC Technician',
  'Tile Setter',
  'Flooring Specialist',
  'General Contractor',
  'Site Manager',
  'Project Manager',
  'Designer',
  'Other',
];

const memberTypeOptions = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'INTERN', label: 'Intern' },
];

const departmentOptions = [
  'Design',
  'Execution',
  'Sales',
  'Management',
  'Operations',
  'Finance',
  'HR',
  'Other',
];

export const AddEngineerModal: React.FC<AddEngineerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState<NewEngineer>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    memberType: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewEngineer, string>>>({});

  const handleInputChange = (field: keyof NewEngineer, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewEngineer, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.memberType) newErrors.memberType = 'Member type is required';

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTeamMember(formData);
      toast.success(`${formData.name} has been added to the team!`);
      onAdd();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      memberType: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add New Team Member</h2>
                <p className="text-orange-100 text-sm">Fill in the details below</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Rajesh Kumar"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`rounded-xl ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select role</option>
                      {roleOptions.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`pl-10 rounded-xl ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="member@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 rounded-xl ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Department & Member Type */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  Department & Employment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                  </div>

                  {/* Member Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.memberType}
                      onChange={(e) => handleInputChange('memberType', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        errors.memberType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select type</option>
                      {memberTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.memberType && <p className="text-red-500 text-xs mt-1">{errors.memberType}</p>}
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary"
                className="rounded-xl"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="rounded-xl bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Team Member
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
