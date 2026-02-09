/**
 * Helper functions for lead-related operations
 */

/**
 * Maps lead source enum values to human-readable labels
 */
export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  PHONE: "Phone Call",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  EXHIBITION: "Exhibition",
  CONTACT_FORM: "Contact Form",
  OTHER: "Other",
  LINKEDIN: "LinkedIn",
  GOOGLE_ADS: "Google Ads",
  EMAIL_CAMPAIGN: "Email Campaign",
  TRADE_SHOW: "Trade Show",
  PARTNER: "Partner",
};

/**
 * Converts a lead source enum value to its display label
 * @param sourceValue - The enum value (e.g., "INSTAGRAM")
 * @returns The human-readable label (e.g., "Instagram")
 */
export function getSourceLabel(sourceValue: string): string {
  return SOURCE_LABELS[sourceValue] || sourceValue;
}

/**
 * Converts a lead source label to its enum value
 * @param sourceLabel - The human-readable label (e.g., "Instagram")
 * @returns The enum value (e.g., "INSTAGRAM")
 */
export function getSourceValue(sourceLabel: string): string {
  const entry = Object.entries(SOURCE_LABELS).find(
    ([_, label]) => label === sourceLabel
  );
  return entry ? entry[0] : sourceLabel;
}
