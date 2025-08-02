
// Consistent labels used across admin filters and employer forms

export const qualifications = [
  "Secondary School",
  "Vocational Training",
  "Diploma",
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Professional Certification"
];

export const experienceLevels = [
  "Entry Level (0-1 years)",
  "Junior (1-3 years)",
  "Mid-Level (3-5 years)",
  "Senior (5-8 years)",
  "Lead (8+ years)",
  "Executive (10+ years)"
] as const;

export type ExperienceLevel = typeof experienceLevels[number];

export const genders = [
  "male",
  "female",
  "other",
];

export const maritalStatuses = [
  "single",
  "married",
  "divorced",
  "widowed"
];

export const profileStatus = [
  "incomplete",
  "verified",
  "pending",
  "rejected"
];

export const jobStatus = [
  "pending",
  "onHold",
  "active",
  "fulfilled",
  "dormant"
];

export const applicationStatus = [
  "applied",
  "shortlisted",
  "interviewed",
  "selected",
  "rejected",
  "expired"
];

export const businessSizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+"
];

export const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Government",
  "Non-profit",
  "Other"
];

export const allowedFileTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf"
];

export const interviewLevels = [
  "beginner",
  "intermediate",
  "advanced",
  "senior"
];
