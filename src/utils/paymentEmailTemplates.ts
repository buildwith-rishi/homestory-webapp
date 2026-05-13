/**
 * Serialize payment-related invoice / proforma / reminder modals into Email Editor templates.
 * Structured fields live in `description` under a versioned marker; `htmlBody` is human-editable.
 */

import type { EmailTemplate } from "../services/emailTemplateApi";

export const PAYMENT_EMAIL_TEMPLATE_MARKER = "GHS_PAYMENT_EMAIL_TEMPLATE_V1:";

export type PaymentEmailTemplateKind = "proforma" | "invoice" | "reminder";

export interface PaymentInvoiceProformaTemplatePayload {
  kind: "proforma";
  toEmail: string;
  toName: string;
  cc: string[];
  customMessage: string;
}

export interface PaymentInvoiceFullTemplatePayload {
  kind: "invoice";
  toEmail: string;
  toName: string;
  cc: string[];
  customMessage: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
  };
}

export interface PaymentReminderTemplatePayload {
  kind: "reminder";
  toEmail: string;
  toName: string;
  subject: string;
  customMessage: string;
}

export type PaymentEmailTemplatePayload =
  | PaymentInvoiceProformaTemplatePayload
  | PaymentInvoiceFullTemplatePayload
  | PaymentReminderTemplatePayload;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nlToBr(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, "<br/>");
}

export function serializePaymentEmailTemplateDescription(
  payload: PaymentEmailTemplatePayload,
): string {
  return PAYMENT_EMAIL_TEMPLATE_MARKER + JSON.stringify(payload);
}

export function parsePaymentEmailTemplateDescription(
  description?: string | null,
): PaymentEmailTemplatePayload | null {
  const raw = (description || "").trim();
  if (!raw.startsWith(PAYMENT_EMAIL_TEMPLATE_MARKER)) return null;
  try {
    const parsed = JSON.parse(
      raw.slice(PAYMENT_EMAIL_TEMPLATE_MARKER.length),
    ) as PaymentEmailTemplatePayload;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("kind" in parsed) ||
      typeof (parsed as PaymentEmailTemplatePayload).kind !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function paymentEmailTemplateSubject(
  payload: PaymentEmailTemplatePayload,
  fallbackPaymentTitle: string,
): string {
  const title = fallbackPaymentTitle.trim() || "Payment";
  switch (payload.kind) {
    case "proforma":
      return `Proforma invoice — ${title}`;
    case "invoice":
      return `Invoice — ${title}`;
    case "reminder":
      return (payload.subject || "").trim() || `Payment reminder — ${title}`;
  }
}

export function paymentEmailTemplateName(
  payload: PaymentEmailTemplatePayload,
  paymentTitle: string,
): string {
  const title = (paymentTitle || "Milestone").trim();
  const stamp = new Date().toISOString().slice(0, 10);
  switch (payload.kind) {
    case "proforma":
      return `Payment · Proforma · ${title} · ${stamp}`;
    case "invoice":
      return `Payment · Invoice · ${title} · ${stamp}`;
    case "reminder":
      return `Payment · Reminder · ${title} · ${stamp}`;
  }
}

export function buildPaymentEmailTemplateHtml(
  payload: PaymentEmailTemplatePayload,
): string {
  const parts: string[] = [];

  switch (payload.kind) {
    case "proforma":
    case "invoice": {
      parts.push("<p><strong>To:</strong> " + escapeHtml(payload.toName));
      parts.push(" &lt;" + escapeHtml(payload.toEmail) + "&gt;</p>");
      if (payload.cc.length > 0) {
        parts.push(
          "<p><strong>CC:</strong> " +
            escapeHtml(payload.cc.join(", ")) +
            "</p>",
        );
      }
      parts.push("<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:16px 0;\" />");
      if (payload.customMessage.trim()) {
        parts.push("<p>" + nlToBr(payload.customMessage.trim()) + "</p>");
      }
      if (payload.kind === "invoice") {
        const b = payload.bankDetails;
        parts.push("<h3 style=\"margin:16px 0 8px;font-size:15px;\">Bank details</h3>");
        parts.push("<table style=\"font-size:14px;border-collapse:collapse;\">");
        parts.push(
          "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7280;\">Account name</td><td>" +
            escapeHtml(b.accountName) +
            "</td></tr>",
        );
        parts.push(
          "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7280;\">Account number</td><td>" +
            escapeHtml(b.accountNumber) +
            "</td></tr>",
        );
        parts.push(
          "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7280;\">IFSC</td><td>" +
            escapeHtml(b.ifscCode) +
            "</td></tr>",
        );
        parts.push(
          "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7280;\">Bank</td><td>" +
            escapeHtml(b.bankName) +
            "</td></tr>",
        );
        if (b.upiId?.trim()) {
          parts.push(
            "<tr><td style=\"padding:4px 12px 4px 0;color:#6b7280;\">UPI</td><td>" +
              escapeHtml(b.upiId.trim()) +
              "</td></tr>",
          );
        }
        parts.push("</table>");
      }
      break;
    }
    case "reminder": {
      parts.push("<p><strong>To:</strong> " + escapeHtml(payload.toName));
      parts.push(" &lt;" + escapeHtml(payload.toEmail) + "&gt;</p>");
      if (payload.subject.trim()) {
        parts.push(
          "<p><strong>Subject line:</strong> " +
            escapeHtml(payload.subject.trim()) +
            "</p>",
        );
      }
      parts.push("<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:16px 0;\" />");
      if (payload.customMessage.trim()) {
        parts.push("<p>" + nlToBr(payload.customMessage.trim()) + "</p>");
      }
      break;
    }
  }

  parts.push(
    "<p style=\"margin-top:20px;font-size:12px;color:#9ca3af;\">Saved from project payments. Edit freely — this body is sent when you use Email Editor.</p>",
  );

  return parts.join("");
}

export function buildInvoiceOrProformaTemplatePayload(args: {
  mode: "invoice" | "proforma";
  toEmail: string;
  toName: string;
  cc: string[];
  customMessage: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
  };
}): PaymentInvoiceProformaTemplatePayload | PaymentInvoiceFullTemplatePayload {
  if (args.mode === "proforma") {
    return {
      kind: "proforma",
      toEmail: args.toEmail.trim(),
      toName: args.toName.trim(),
      cc: args.cc,
      customMessage: args.customMessage,
    };
  }
  const b = args.bankDetails!;
  return {
    kind: "invoice",
    toEmail: args.toEmail.trim(),
    toName: args.toName.trim(),
    cc: args.cc,
    customMessage: args.customMessage,
    bankDetails: {
      accountName: b.accountName.trim(),
      accountNumber: b.accountNumber.trim(),
      ifscCode: b.ifscCode.trim(),
      bankName: b.bankName.trim(),
      upiId: b.upiId?.trim() || undefined,
    },
  };
}

function paymentTemplateTimestamp(
  t: Pick<EmailTemplate, "updatedAt" | "createdAt">,
): number {
  const raw = t.updatedAt || t.createdAt;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Pick the most recently updated template whose structured `description` matches `kind`.
 */
export function selectLatestPaymentEmailTemplate(
  templates: EmailTemplate[],
  kind: PaymentEmailTemplateKind,
): EmailTemplate | null {
  const candidates = templates.filter((template) => {
    const parsed = parsePaymentEmailTemplateDescription(template.description);
    return parsed?.kind === kind;
  });
  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) => paymentTemplateTimestamp(b) - paymentTemplateTimestamp(a),
  );
  return candidates[0];
}

/**
 * Extract the main message block from HTML produced by `buildPaymentEmailTemplateHtml`
 * (content after the first `<hr>`, before bank details or the footer note).
 */
export function extractCustomMessageFromPaymentTemplateHtml(
  htmlBody: string | undefined,
  _kind: PaymentEmailTemplateKind,
): string {
  if (!htmlBody?.trim()) return "";
  try {
    const doc = new DOMParser().parseFromString(htmlBody, "text/html");
    const children = Array.from(doc.body.children);
    const hrIdx = children.findIndex(
      (n) => n.nodeName.toLowerCase() === "hr",
    );
    if (hrIdx < 0) return "";
    const chunks: string[] = [];
    for (let i = hrIdx + 1; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const tag = el.nodeName.toLowerCase();
      if (tag === "h3" && /bank details/i.test(el.textContent || "")) break;
      const t = (el.textContent || "").trim();
      if (/saved from project payments/i.test(t)) break;
      if (tag === "p" && t) chunks.push(t);
    }
    return chunks.join("\n\n").trim();
  } catch {
    return "";
  }
}

export function resolvePaymentModalCustomMessage(options: {
  templates: EmailTemplate[];
  kind: "proforma" | "invoice";
  fallback: string;
}): string {
  const picked = selectLatestPaymentEmailTemplate(
    options.templates,
    options.kind,
  );
  if (!picked) return options.fallback;
  const payload = parsePaymentEmailTemplateDescription(picked.description);
  if (
    payload?.kind === options.kind &&
    "customMessage" in payload &&
    payload.customMessage?.trim()
  ) {
    return payload.customMessage.trim();
  }
  const extracted = extractCustomMessageFromPaymentTemplateHtml(
    picked.htmlBody,
    options.kind,
  );
  if (extracted.trim()) return extracted.trim();
  return options.fallback;
}

export function resolvePaymentReminderModalDefaults(options: {
  templates: EmailTemplate[];
  fallbackSubject: string;
  fallbackMessage: string;
}): { subject: string; customMessage: string } {
  const picked = selectLatestPaymentEmailTemplate(
    options.templates,
    "reminder",
  );
  if (!picked) {
    return {
      subject: options.fallbackSubject,
      customMessage: options.fallbackMessage,
    };
  }
  const payload = parsePaymentEmailTemplateDescription(picked.description);

  let customMessage = options.fallbackMessage;
  if (payload?.kind === "reminder" && payload.customMessage?.trim()) {
    customMessage = payload.customMessage.trim();
  } else {
    const extracted = extractCustomMessageFromPaymentTemplateHtml(
      picked.htmlBody,
      "reminder",
    );
    if (extracted.trim()) customMessage = extracted.trim();
  }

  let subject = options.fallbackSubject;
  if (payload?.kind === "reminder" && payload.subject?.trim()) {
    subject = payload.subject.trim();
  } else if ((picked.subject || "").trim()) {
    subject = (picked.subject || "").trim();
  }

  return { subject, customMessage };
}
