/**
 * Account Type Helper Utilities
 * Provides centralized mapping and helper functions for account types
 */

// Account type enum values as per Prisma schema
export type AccountTypeValue = 'RESIDENTIAL' | 'COMMERCIAL';

// Account type display labels
export const ACCOUNT_TYPE_LABELS: Record<AccountTypeValue, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
};

// Account type descriptions
export const ACCOUNT_TYPE_DESCRIPTIONS: Record<AccountTypeValue, string> = {
  RESIDENTIAL: 'Individual or family residential account',
  COMMERCIAL: 'Business or commercial account',
};

/**
 * Get display label for an account type enum value
 * @param value - Account type enum value (e.g., "HOUSEHOLD")
 * @returns Display label (e.g., "Household")
 */
export function getAccountTypeLabel(value: string): string {
  const accountType = value as AccountTypeValue;
  return ACCOUNT_TYPE_LABELS[accountType] || value;
}

/**
 * Get account type enum value from display label
 * @param label - Display label (e.g., "Household")
 * @returns Account type enum value (e.g., "HOUSEHOLD")
 */
export function getAccountTypeValue(label: string): AccountTypeValue | undefined {
  const entry = Object.entries(ACCOUNT_TYPE_LABELS).find(
    ([, labelValue]) => labelValue.toLowerCase() === label.toLowerCase()
  );
  return entry ? (entry[0] as AccountTypeValue) : undefined;
}

/**
 * Get description for an account type
 * @param value - Account type enum value
 * @returns Account type description
 */
export function getAccountTypeDescription(value: string): string {
  const accountType = value as AccountTypeValue;
  return ACCOUNT_TYPE_DESCRIPTIONS[accountType] || '';
}

/**
 * Get all account types as an array of {value, label} objects
 * Useful for dropdowns and select components
 */
export function getAllAccountTypes(): Array<{ value: AccountTypeValue; label: string; description: string }> {
  return (Object.keys(ACCOUNT_TYPE_LABELS) as AccountTypeValue[]).map((value) => ({
    value,
    label: ACCOUNT_TYPE_LABELS[value],
    description: ACCOUNT_TYPE_DESCRIPTIONS[value],
  }));
}
