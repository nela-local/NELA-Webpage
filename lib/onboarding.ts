export const ONBOARDING_OCCUPATIONS = [
  { id: 'business_owner', label: 'Business owner (MSME)' },
  { id: 'ca_accountant', label: 'CA / Accountant' },
  { id: 'professional', label: 'Professional' },
  { id: 'student', label: 'Student' },
  { id: 'freelancer', label: 'Freelancer' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'educator', label: 'Educator' },
  { id: 'hobbyist', label: 'Hobbyist' },
  { id: 'other', label: 'Other' },
] as const;

export const ONBOARDING_FIELDS = [
  { id: 'trading_retail', label: 'Trading & Retail' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'services', label: 'Services' },
  { id: 'accounting', label: 'Accounting & Tax' },
  { id: 'business', label: 'Business & Finance' },
  { id: 'software', label: 'Software & Engineering' },
  { id: 'design', label: 'Design & Creative' },
  { id: 'science', label: 'Science & Research' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'legal', label: 'Legal' },
  { id: 'other', label: 'Other' },
] as const;

export type OnboardingOccupationId =
  (typeof ONBOARDING_OCCUPATIONS)[number]['id'];
export type OnboardingFieldId = (typeof ONBOARDING_FIELDS)[number]['id'];
