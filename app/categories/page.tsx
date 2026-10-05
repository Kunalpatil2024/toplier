import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import Leaderboard from "@/components/Leaderboard";
import { CATEGORIES } from "@/lib/constants";
import { getListingFeed, isCategory } from "@/lib/data";

export const metadata: Metadata = { title: "Categories" };

type CategoriesPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const activeCategory = params.category && isCategory(params.category) ? params.category : undefined;
  const allFeed = await getListingFeed();
  const feed = activeCategory ? await getListingFeed(activeCategory) : allFeed;

  return (
    <main className="page-main">
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> Find your corner</div>
          <h1 className="display">A board for every builder.</h1>
          <p>Explore products by category, then see who&apos;s earning the top spots.</p>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((category) => {
            const count = allFeed.listings.filter((listing) => listing.category === category).length;
            return (
              <Link
                key={category}
                className={`category-tile ${activeCategory === category ? "active" : ""}`}
                href={`/categories?category=${encodeURIComponent(category)}`}
                aria-current={activeCategory === category ? "page" : undefined}
              >
                <span><Layers3 size={15} style={{ marginRight: 9, verticalAlign: "-3px" }} />{category}</span>
                <span className="muted">{count}</span>
              </Link>
            );
          })}
        </div>
        <div className="category-list-heading">
          <h2 className="display">{activeCategory ?? "All products"}</h2>
          <span>{feed.listings.length} {feed.listings.length === 1 ? "listing" : "listings"}</span>
        </div>
        <CategoryFilter active={activeCategory} />
        <div style={{ marginTop: 16 }}><Leaderboard feed={feed} /></div>
        <div className="browse-footer">
          <Link className="button button-quiet button-small" href="/submit">List your product <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </main>
  );
}