import { connection } from "next/server";
import { CATEGORIES, type Category } from "@/lib/constants";
import { DEMO_LISTINGS } from "@/lib/demo-data";
import { getSupabase, isUuid } from "@/lib/supabase";
import type { Listing } from "@/types/database";

export type ListingFeed = {
  listings: Listing[];
  source: "database" | "demo";
  notice?: string;
};

export type ListingDetail = {
  listing: Listing;
  listings: Listing[];
  demo: boolean;
};

export type AdminData = {
  status: "database" | "unconfigured" | "unavailable";
  listings: Listing[];
};

export function isCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}

export async function getListingFeed(category?: Category): Promise<ListingFeed> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      listings: category ? DEMO_LISTINGS.filter((listing) => listing.category === category) : DEMO_LISTINGS,
      source: "demo",
      notice: "Preview data. Connect Supabase to publish real listings.",
    };
  }

  await connection();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("rank_value", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(500);

  if (error) {
    return {
      listings: [],
      source: "database",
      notice: "Live listings could not be loaded. Please try again later.",
    };
  }

  if (!data.length) {
    return { listings: [], source: "database" };
  }

  return {
    listings: category ? data.filter((listing) => listing.category === category) : data,
    source: "database",
  };
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const demoListing = DEMO_LISTINGS.find((listing) => listing.id === id);
    return demoListing ? { listing: demoListing, listings: DEMO_LISTINGS, demo: true } : null;
  }
  if (!isUuid(id)) return null;

  await connection();
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (listingError) throw new Error(`Failed to load listing: ${listingError.message}`);
  if (!listing) return null;

  const allListings: Listing[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data: page, error } = await supabase
      .from("listings")
      .select("*")
      .order("rank_value", { ascending: false })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + 499);

    if (error) throw new Error(`Failed to load leaderboard: ${error.message}`);
    allListings.push(...page);
    if (page.length < 500) break;
  }

  return { listing, listings: allListings, demo: false };
}

export async function getAdminData(): Promise<AdminData> {
  const supabase = getSupabase();
  if (!supabase) return { status: "unconfigured", listings: [] };

  await connection();
  const listings: Listing[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + 499);

    if (error || !data) return { status: "unavailable", listings: [] };
    listings.push(...data);
    if (data.length < 500) break;
  }

  return { status: "database", listings };
}
