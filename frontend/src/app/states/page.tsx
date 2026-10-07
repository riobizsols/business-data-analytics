import Link from "next/link";
import { apiGet } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Companies by State",
};

export default async function StatesPage() {
  const data = await apiGet<{ items: { state: string; count: number }[] }>(
    "/api/companies/stats/by-state"
  );
  const items = data.items;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Companies by State</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">Click a state to view the full list of companies in that state.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <Link
              key={s.state}
              href={`/companies?state=${encodeURIComponent(s.state)}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="truncate pr-4 text-gray-800 dark:text-gray-100">{s.state}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{s.count.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </main>
    </AuthGuard>
  );
}
