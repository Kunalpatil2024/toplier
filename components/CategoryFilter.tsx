import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/constants";

type CategoryFilterProps = { active?: Category };

export default function CategoryFilter({ active }: CategoryFilterProps) {
  return (
    <nav className="category-strip" aria-label="Filter by category">
      <Link className={`category-link ${!active ? "active" : ""}`} href="/categories">All products</Link>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          className={`category-link ${active === category ? "active" : ""}`}
          href={`/categories?category=${encodeURIComponent(category)}`}
          aria-current={active === category ? "page" : undefined}
        >
          {category}
        </Link>
      ))}
    </nav>
  );
}