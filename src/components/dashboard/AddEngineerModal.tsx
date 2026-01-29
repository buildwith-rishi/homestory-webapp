import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Wrench, Plus, Loader2 } from 'lucide-react';
import { Button, Input } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AddEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (engineer: NewEngineer) => void;
}

export interface NewEngineer {
  name: string;
  role: string;
  phone: string;
  email: string;
  status: 'available' | 'on_site' | 'busy';
  skills: string[];
  location?: string;
  experience?: number;
  address?: string;
  emergencyContact?: string;
  notes?: string;
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
  'Project Manager',
  'Other',
];

const skillOptions = [
  'Carpentry',
  'Woodwork',
  'Furniture',
  'Electrical',
  'Lighting',
  'Wiring',
  'Plumbing',
  'Sanitary',
  'Fixtures',
  'Painting',
  'Texture',
  'Finishing',
  'Masonry',
  'Tiling',
  'Flooring',
  'Welding',
  'HVAC',
  'Drywall',
  'Roofing',
  'Landscaping',
];

export const AddEngineerModal: React.FC<AddEngineerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState<NewEngineer>({
    name: '',
    role: '',
    phone: '',
    email: '',
    status: 'available',
    skills: [],
    location: '',
    experience: undefined,
    address: '',
    emergencyContact: '',
    notes: '',
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewEngineer, string>>>({});

  const handleInputChange = (field: keyof NewEngineer, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      }
      return [...prev, skill];
    });
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewEngineer, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (selectedSkills.length === 0) {
      newErrors.skills = 'At least one skill is required';
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const engineerData = {
        ...formData,
        skills: selectedSkills,
      };

      onAdd(engineerData);
      toast.success('Engineer added successfully!');
      handleClose();
    } catch (error) {
      toast.error('Failed to add engineer. Please try again.');
      console.error('Error adding engineer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      role: '',
      phone: '',
      email: '',
      status: 'available',
      skills: [],
      location: '',
      experience: undefined,
      address: '',
      emergencyContact: '',
      notes: '',
    });
    setSelectedSkills([]);
    setCustomSkill('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop - Full screen glassmorphic effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-md"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
          }}
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add New Engineer</h2>
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
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="engineer@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 rounded-xl ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="available">Available</option>
                      <option value="on_site">On Site</option>
                      <option value="busy">Busy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g., 5"
                      value={formData.experience || ''}
                      onChange={(e) => handleInputChange('experience', e.target.value ? parseInt(e.target.value) : '')}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-blue-600" />
                  </div>
                  Skills & Expertise <span className="text-red-500 text-sm">*</span>
                </h3>

                {/* Selected Skills */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSkills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skill Options */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        selectedSkills.includes(skill)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                {/* Custom Skill Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add custom skill..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={addCustomSkill}
                    variant="secondary"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
                {errors.skills && <p className="text-red-500 text-xs mt-2">{errors.skills}</p>}
              </div>

              {/* Location & Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  Location & Additional Contact
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Location / Site
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., HSR Layout Villa"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <Input
                      type="text"
                      placeholder="Full address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <Input
                      type="tel"
                      placeholder="Emergency contact number"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
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
                    Add Engineer
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
