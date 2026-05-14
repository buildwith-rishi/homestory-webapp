import React, { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  isVendorKycAttachmentId,
  resolveVendorKycStoredHref,
} from "../../services/vendorKycAttachments";

type Props = {
  stored: string;
  className?: string;
  linkLabel?: string;
  /** `minimal` — subtle text link; `primary` — solid button (default) */
  variant?: "primary" | "minimal";
};

/**
 * Resolves vendor KYC `stored` values: attachment UUID → GET /api/attachments/:id,
 * or opens http(s) / data URLs directly.
 */
const minimalClass =
  "inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline";

export const VendorKycDocLink: React.FC<Props> = ({
  stored,
  className,
  linkLabel = "View document",
  variant = "primary",
}) => {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => isVendorKycAttachmentId(stored));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!stored?.trim()) {
      setHref(null);
      setLoading(false);
      return;
    }
    const s = stored.trim();
    if (!isVendorKycAttachmentId(s)) {
      setHref(s);
      setLoading(false);
      return;
    }
    setLoading(true);
    resolveVendorKycStoredHref(s).then((url) => {
      if (cancelled) return;
      setHref(url);
      setLoading(false);
      if (!url) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [stored]);

  if (loading) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-gray-500 ${className ?? ""}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading…
      </span>
    );
  }
  if (failed || !href) {
    return (
      <span className={`text-xs text-gray-400 ${className ?? ""}`}>
        Could not open
      </span>
    );
  }

  const mergedClass =
    className ??
    (variant === "minimal"
      ? minimalClass
      : "inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors");

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={mergedClass}>
      <span className="truncate max-w-[10rem] sm:max-w-[14rem]">{linkLabel}</span>
      <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
    </a>
  );
};
