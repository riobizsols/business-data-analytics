import Link from "next/link";
import { apiGet } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Companies by Category",
};

export default async function CategoriesPage() {
  const data = await apiGet<{ items: { mca_category: string; count: number }[] }>(
    "/api/companies/stats/by-category"
  );
  const items = data.items;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Companies by Category</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">Click a category to view the full list of companies.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.mca_category}
              href={`/companies?mca_category=${encodeURIComponent(c.mca_category)}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="truncate pr-4 text-gray-800 dark:text-gray-100">{c.mca_category}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{c.count.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </main>
    </AuthGuard>
  );
}
