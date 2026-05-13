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
};

/**
 * Resolves vendor KYC `stored` values: attachment UUID → GET /api/attachments/:id,
 * or opens http(s) / data URLs directly.
 */
export const VendorKycDocLink: React.FC<Props> = ({
  stored,
  className,
  linkLabel = "View document",
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
      <span className={`inline-flex items-center gap-1.5 text-xs text-gray-500 ${className ?? ""}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading…
      </span>
    );
  }
  if (failed || !href) {
    return (
      <span className={`text-xs text-gray-400 ${className ?? ""}`}>
        Could not load document
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1 truncate"
      }
    >
      <span className="truncate">{linkLabel}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
};
