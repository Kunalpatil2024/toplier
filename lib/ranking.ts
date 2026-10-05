import { MINIMUM_INCREMENT } from "@/lib/constants";
import type { Listing } from "@/types/database";

export function sortListings(listings: Listing[]): Listing[] {
  return [...listings].sort(
    (left, right) =>
      right.rank_value - left.rank_value ||
      left.created_at.localeCompare(right.created_at) ||
      left.id.localeCompare(right.id),
  );
}

export function getCurrentRank(listings: Listing[], listingId: string): number {
  const index = sortListings(listings).findIndex((listing) => listing.id === listingId);
  return index === -1 ? 0 : index + 1;
}

export function getRequiredRankValue(
  listings: Listing[],
  listingId: string,
  minimumIncrement = MINIMUM_INCREMENT,
): number {
  const sorted = sortListings(listings);
  const index = sorted.findIndex((listing) => listing.id === listingId);

  if (index < 0) return 0;
  if (index === 0) return sorted[index].rank_value + minimumIncrement;
  return sorted[0].rank_value + minimumIncrement;
}