import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../components/ui";
import { Image as ImageIcon, Link2 } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, altText: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setAltText("");
      setPreviewError(false);
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onInsert(url.trim(), altText.trim() || "Image");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Image" size="sm">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Image URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreviewError(false);
              }}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Alt Text
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image (for accessibility)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 outline-none text-sm transition-colors"
          />
        </div>

        {/* Preview */}
        {url.trim() && !previewError && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-center overflow-hidden">
            <img
              src={url}
              alt={altText || "Preview"}
              className="max-h-40 max-w-full object-contain rounded-lg"
              onError={() => setPreviewError(true)}
            />
          </div>
        )}
        {previewError && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
            <p className="text-xs text-amber-600">Unable to preview image. The URL may be invalid or inaccessible.</p>
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
            <ImageIcon className="w-4 h-4" />
            Insert Image
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ImageModal;
