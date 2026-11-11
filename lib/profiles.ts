import type { StudentYear, UserGroup } from "./types";

/**
 * The choices shown on "Who are you practicing as?" and in Settings.
 * Each student year maps to the usage-rule group in /lib/access.ts
 * (Year 1–2 or Year 3–4), so usage rules stay in one place.
 */
export interface ProfileOption {
  key: string;
  group: UserGroup;
  year: StudentYear | null;
  label: string;
  blurb: string;
}

export const PROFILE_OPTIONS: ProfileOption[] = [
  {
    key: "year-1",
    group: "year-1-2",
    year: 1,
    label: "Year 1 student",
    blurb: "Persons & Family Relations and Obligations. After class only.",
  },
  {
    key: "year-2",
    group: "year-1-2",
    year: 2,
    label: "Year 2 student",
    blurb: "Sales. After class only.",
  },
  {
    key: "year-3",
    group: "year-3-4",
    year: 3,
    label: "Year 3 student",
    blurb: "Succession. Quick Check in class; drills outside class.",
  },
  {
    key: "year-4",
    group: "year-3-4",
    year: 4,
    label: "Year 4 student",
    blurb: "All Civil Law topics. Quick Check in class; drills outside class.",
  },
  {
    key: "bar-first-time",
    group: "bar-first-time",
    year: null,
    label: "Bar reviewee (first-time)",
    blurb: "All Civil Law topics, anytime. Optional diagnostic.",
  },
  {
    key: "bar-repeater",
    group: "bar-repeater",
    year: null,
    label: "Bar reviewee (repeater)",
    blurb: "All Civil Law topics, anytime. A short diagnostic finds weak spots first.",
  },
];

/** Finds the option matching a saved group and year (used to tick the right radio button). */
export function findProfileKey(
  group: UserGroup | null,
  year: StudentYear | null,
): string | null {
  if (!group) return null;
  const exact = PROFILE_OPTIONS.find((p) => p.group === group && p.year === year);
  if (exact) return exact.key;
  return PROFILE_OPTIONS.find((p) => p.group === group)?.key ?? null;
}

/** Query-string suffix for /api/topics, e.g. "&year=2". Empty for bar reviewees. */
export function yearQuery(year: StudentYear | null | undefined): string {
  return year ? `&year=${year}` : "";
}
