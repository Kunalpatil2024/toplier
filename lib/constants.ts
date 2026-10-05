export const MINIMUM_INCREMENT = 5;
export const MINIMUM_STARTING_VALUE = 99;

export const CATEGORIES = [
  "AI",
  "SaaS",
  "Startups",
  "Creators",
  "Gaming",
  "Developer Tools",
  "Student Projects",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];