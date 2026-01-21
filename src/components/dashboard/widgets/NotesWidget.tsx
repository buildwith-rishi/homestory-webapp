import React, { useState, useEffect } from "react";
import { X, StickyNote, Save, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button } from "../../ui";
import { WidgetProps } from "./index";

const STORAGE_KEY = "dashboard-notes";
const MAX_CHARS = 500;

const NotesWidget: React.FC<WidgetProps> = ({ onRemove }) => {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { content, savedAt } = JSON.parse(saved);
        setNotes(content || "");
        setLastSaved(savedAt ? new Date(savedAt) : null);
      } catch {
        setNotes(saved);
      }
    }
  }, []);

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    if (!notes) return;

    const timer = setTimeout(() => {
      const data = {
        content: notes,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes]);

  const handleSave = () => {
    setIsSaving(true);

    const data = {
      content: notes,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    setLastSaved(new Date());
    setIsSaving(false);
    setShowSaved(true);

    setTimeout(() => {
      setShowSaved(false);
    }, 1500);
  };

  const handleClear = () => {
    setNotes("");
    localStorage.removeItem(STORAGE_KEY);
    setLastSaved(null);
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const charCount = notes.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;

  return (
    <Card className="h-full animate-scale-in group relative flex flex-col">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all z-10"
        title="Remove widget"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Dashboard Notes
              </h3>
              <p className="text-xs text-gray-500">
                {lastSaved
                  ? `Saved ${formatLastSaved(lastSaved)}`
                  : "Not saved yet"}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {showSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-emerald-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            value={notes}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setNotes(e.target.value);
              }
            }}
            placeholder="Jot down your notes, reminders, or important tasks..."
            className="w-full h-full min-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 resize-none transition-all"
          />

          {/* Character Counter */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  charPercentage > 90
                    ? "bg-red-500"
                    : charPercentage > 70
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(charPercentage, 100)}%` }}
              />
            </div>
            <span
              className={`text-xs ${
                charPercentage > 90 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!notes}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={!notes || isSaving}
            className="rounded-xl"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotesWidget;
