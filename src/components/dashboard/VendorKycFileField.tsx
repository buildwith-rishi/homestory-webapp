import React, { useRef, useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  type VendorKycSlot,
  uploadVendorKycAttachment,
  deleteVendorKycAttachmentIfPresent,
  isVendorKycAttachmentId,
} from "../../services/vendorKycAttachments";

export type { VendorKycSlot };

export type VendorKycFieldKey =
  | "aadhaarUrl"
  | "panUrl"
  | "gstCertificateUrl"
  | "msmeCertificateUrl";

const DEFAULT_MAX_BYTES = 4 * 1024 * 1024; // 4 MB — keeps JSON payloads reasonable

type Props = {
  label: string;
  /** Persisted: attachment UUID, https URL, or legacy data URL */
  value: string;
  onChange: (next: string) => void;
  /** Which KYC slot — drives attachment notes/type on upload */
  kycSlot: VendorKycSlot;
  /** When set, files upload immediately via POST /api/attachments */
  teamMemberId?: string | null;
  /** Member `userId` — sent as `entityId` when env `VITE_VENDOR_KYC_ATTACHMENT_ENTITY_ID=user` */
  linkedUserId?: string | null;
  /** Add-vendor flow: chosen file before the member exists (uploaded after create) */
  pendingFile?: File | null;
  onPendingFileChange?: (file: File | null) => void;
  accept?: string;
  maxBytes?: number;
  disabled?: boolean;
};

function displaySummary(
  value: string,
  pendingFile: File | null | undefined,
): string {
  if (pendingFile?.name) return pendingFile.name;
  if (!value?.trim()) return "";
  if (value.startsWith("data:")) return "File attached (legacy)";
  if (isVendorKycAttachmentId(value)) return "Document linked (cloud)";
  if (/^https?:\/\//i.test(value)) return value;
  return value;
}

/**
 * Vendor KYC file field: uploads via POST /api/attachments when `teamMemberId` is set;
 * otherwise holds a pending file for upload after the team member is created.
 */
export const VendorKycFileField: React.FC<Props> = ({
  label,
  value,
  onChange,
  kycSlot,
  teamMemberId,
  linkedUserId,
  pendingFile,
  onPendingFileChange,
  accept = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*",
  maxBytes = DEFAULT_MAX_BYTES,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const hasStored = Boolean(value?.trim());
  const hasPending = Boolean(pendingFile);
  const hasValue = hasStored || hasPending;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    if (file.size > maxBytes) {
      toast.error(
        `"${file.name}" is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      );
      return;
    }

    if (!teamMemberId) {
      onPendingFileChange?.(file);
      return;
    }

    setUploading(true);
    try {
      const previousId = isVendorKycAttachmentId(value) ? value.trim() : null;
      const attachment = await uploadVendorKycAttachment(teamMemberId, file, kycSlot, {
        linkedUserId,
      });
      const newId = attachment.id?.trim();
      if (!newId) {
        toast.error("Upload succeeded but no attachment id was returned.");
        return;
      }
      if (previousId && previousId !== newId) {
        void deleteVendorKycAttachmentIfPresent(previousId);
      }
      onChange(newId);
      onPendingFileChange?.(null);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (disabled) return;
    if (pendingFile) {
      onPendingFileChange?.(null);
      return;
    }
    if (isVendorKycAttachmentId(value)) {
      await deleteVendorKycAttachmentIfPresent(value);
    }
    onChange("");
  };

  const busy = uploading || disabled;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        className={`flex flex-col gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-3 ${
          disabled ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFile}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:border-orange-300 hover:bg-orange-50/60 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-orange-500" />
            )}
            {uploading ? "Uploading…" : "Choose file"}
          </button>
          {hasValue && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        {hasValue && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FileText className="w-3.5 h-3.5 shrink-0 text-purple-500" />
            <span className="truncate">{displaySummary(value, pendingFile)}</span>
          </div>
        )}
        {!hasValue && (
          <p className="text-[11px] text-gray-400">
            PDF or image. Max {Math.round(maxBytes / (1024 * 1024))} MB.
            {teamMemberId
              ? " Uploads immediately."
              : " Files upload after you save the new vendor."}
          </p>
        )}
      </div>
    </div>
  );
};
