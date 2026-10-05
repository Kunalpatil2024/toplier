import { CATEGORIES, MINIMUM_STARTING_VALUE, type Category } from "@/lib/constants";

export type ListingInput = {
  name: string;
  description: string;
  websiteUrl: string;
  category: Category;
  twitterUrl: string | null;
  logoUrl: string | null;
  rankValue: number;
};

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isTwitterUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;
  const hostname = new URL(value).hostname.toLowerCase();
  return ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(hostname);
}

export function validateListingInput(formData: FormData): ValidationResult<ListingInput> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const twitterValue = String(formData.get("twitterUrl") ?? "").trim();
  const logoValue = String(formData.get("logoUrl") ?? "").trim();
  const rankValue = Number(formData.get("rankValue"));

  if (name.length < 2 || name.length > 60) {
    return { ok: false, error: "Product name must be between 2 and 60 characters." };
  }
  if (description.length < 10 || description.length > 280) {
    return { ok: false, error: "Description must be between 10 and 280 characters." };
  }
  if (!isHttpUrl(websiteUrl)) {
    return { ok: false, error: "Enter a valid website URL starting with http:// or https://." };
  }
  if (!CATEGORIES.includes(category as Category)) {
    return { ok: false, error: "Choose one of the listed categories." };
  }
  if (twitterValue && !isTwitterUrl(twitterValue)) {
    return { ok: false, error: "Enter a valid X or Twitter profile URL." };
  }
  if (logoValue && !isHttpUrl(logoValue)) {
    return { ok: false, error: "Enter a valid logo URL starting with http:// or https://." };
  }
  if (
    !Number.isSafeInteger(rankValue) ||
    rankValue < MINIMUM_STARTING_VALUE ||
    rankValue > 1_000_000_000
  ) {
    return { ok: false, error: `Starting value must be a whole amount between ₹${MINIMUM_STARTING_VALUE} and ₹1,000,000,000.` };
  }

  return {
    ok: true,
    data: {
      name,
      description,
      websiteUrl,
      category: category as Category,
      twitterUrl: twitterValue || null,
      logoUrl: logoValue || null,
      rankValue,
    },
  };
}
