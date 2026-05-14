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

function humanizeStored(value: string): string {
  if (!value.trim()) return "";
  if (value.startsWith("data:")) return "Saved file";
  if (isVendorKycAttachmentId(value)) return "Uploaded";
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value);
      const host = u.hostname.replace(/^www\./, "");
      const tail =
        u.pathname && u.pathname !== "/"
          ? u.pathname.length > 20
            ? `${u.pathname.slice(0, 18)}…`
            : u.pathname
          : "";
      return tail ? `${host}${tail}` : host;
    } catch {
      return value.length > 36 ? `${value.slice(0, 34)}…` : value;
    }
  }
  return value.length > 40 ? `${value.slice(0, 38)}…` : value;
}

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
  /** Parent renders label (e.g. in a table row) */
  hideLabel?: boolean;
  /** Tighter padding for inline / list layouts */
  dense?: boolean;
};

function displaySummary(
  value: string,
  pendingFile: File | null | undefined,
): string {
  if (pendingFile?.name) return pendingFile.name;
  if (!value?.trim()) return "";
  return humanizeStored(value);
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
  hideLabel,
  dense,
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
  const pad = dense ? "px-3 py-2.5" : "px-3 py-3";

  return (
    <div>
      {!hideLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        className={`flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/50 ${pad} ${
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
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-gray-500" />
            )}
            {uploading ? "Uploading…" : hasValue ? "Replace" : "Upload"}
          </button>
          {hasValue && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-transparent hover:border-gray-200 hover:bg-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        {hasValue && (
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
            <span className="break-all line-clamp-2">{displaySummary(value, pendingFile)}</span>
          </div>
        )}
        {!hasValue && !dense && (
          <p className="text-[11px] text-gray-400">
            PDF or image · max {Math.round(maxBytes / (1024 * 1024))} MB
            {teamMemberId ? " · saves on upload" : " · uploads after vendor is created"}
          </p>
        )}
      </div>
    </div>
  );
};
