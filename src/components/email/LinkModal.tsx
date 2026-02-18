import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../components/ui";
import { Link2, ExternalLink, X } from "lucide-react";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text: string) => void;
  initialUrl?: string;
  initialText?: string;
}

const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialUrl = "",
  initialText = "",
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialUrl, initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const finalUrl = url.startsWith("http") ? url : `https://${url}`;
    onInsert(finalUrl, text.trim() || finalUrl);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Link" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Display Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Link text (optional)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">
            Leave empty to use the URL as display text
          </p>
        </div>

        {url.trim() && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <ExternalLink className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-xs text-gray-600 truncate">
              {text.trim() || url.trim()} → {url.startsWith("http") ? url : `https://${url}`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!url.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Link2 className="w-4 h-4" />
            Insert Link
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LinkModal;
