import React, { useState } from "react";
import {
  X,
  Plus,
  User,
  Briefcase,
  Calendar,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Input } from "../../ui";
import { WidgetProps } from "./index";

type QuickAddType = "lead" | "customer" | "meeting";

const QuickAddWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [activeType, setActiveType] = useState<QuickAddType>("lead");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const typeOptions = [
    {
      id: "lead",
      label: "New Lead",
      icon: User,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "customer",
      label: "New Customer",
      icon: Briefcase,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "meeting",
      label: "Schedule Meeting",
      icon: Calendar,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setShowSuccess(true);
    setFormData({ name: "", email: "", phone: "", date: "", time: "" });

    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <Card className="h-full animate-scale-in group relative">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Quick Add</h3>
              <p className="text-xs text-gray-500">Create without leaving</p>
            </div>
          </div>
        </div>

        {/* Type Selector */}
        <div className="flex gap-2 mb-4">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeType === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setActiveType(option.id as QuickAddType)}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  isActive
                    ? "border-orange-300 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${option.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs ${isActive ? "text-orange-700 font-medium" : "text-gray-600"}`}
                >
                  {option.label.replace("New ", "").replace("Schedule ", "")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {activeType === "lead"
                  ? "Lead"
                  : activeType === "customer"
                    ? "Customer"
                    : "Meeting"}{" "}
                Created!
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <Input
                placeholder={
                  activeType === "meeting" ? "Meeting Title" : "Name"
                }
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-sm"
              />

              {activeType !== "meeting" && (
                <>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="text-sm"
                  />
                </>
              )}

              {activeType === "meeting" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full rounded-xl"
                disabled={!formData.name || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create{" "}
                    {activeType === "lead"
                      ? "Lead"
                      : activeType === "customer"
                        ? "Customer"
                        : "Meeting"}
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

export default QuickAddWidget;
