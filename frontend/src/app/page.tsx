import Link from "next/link";
import { apiGet, Summary } from "@/lib/api";
import { TrendingUp, Building2, Users, ListChecks } from "lucide-react";
import { formatIndianCurrency } from "@/lib/formatters";
import AuthGuard from "@/components/AuthGuard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await apiGet<Summary>("/api/analytics/summary");
  const byState = await apiGet<{ items: { state: string; count: number }[] }>(
    "/api/companies/stats/by-state"
  );
  const byCategory = await apiGet<{ items: { mca_category: string; count: number }[] }>(
    "/api/companies/stats/by-category"
  );
  const byPaidUp = await apiGet<{ items: { label: string; count: number; min: number | null; max: number | null }[] }>(
    "/api/companies/stats/by-paid-up-capital"
  );
  
  const stats = [
    { 
      title: "Total Companies", 
      value: formatIndianCurrency(summary.total_companies), 
      icon: Building2,
      color: "bg-blue-500"
    },
    { 
      title: "Total Directors", 
      value: formatIndianCurrency(summary.total_directors), 
      icon: Users,
      color: "bg-purple-500"
    },
    { 
      title: "Avg Directors/Company", 
      value: (summary.total_directors / summary.total_companies).toFixed(1), 
      icon: TrendingUp,
      color: "bg-green-500"
    },
  ];
  
  const cards = [
    { title: "Companies", value: formatIndianCurrency(summary.total_companies), href: "/companies", color: "indigo" },
    { title: "Directors", value: formatIndianCurrency(summary.total_directors), href: "/directors", color: "indigo" },
    { title: "Batch Operations", value: "New", href: "/batch", color: "green", badge: true },
  ];

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to Business Data Analytics
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
            Explore comprehensive data on companies and directors across India
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.title} href={c.href} className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">{c.title}</div>
                {c.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    NEW
                  </span>
                )}
              </div>
              <div className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{c.value}</div>
              <div className={`mt-5 text-xs text-${c.color}-600 group-hover:underline`}>
                {c.badge ? "Start workflow" : `View ${c.title.toLowerCase()}`} →
              </div>
            </Link>
          ))}
        </div>

        {/* Companies by State */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Companies by State</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byState.items.slice(0, 12).map((s) => (
              <Link
                key={s.state}
                href={`/companies?state=${encodeURIComponent(s.state)}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="truncate pr-4 text-gray-800 dark:text-gray-100">{s.state}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{s.count.toLocaleString()}</span>
              </Link>
            ))}
            <Link href="/states" className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800/50">
              View more states →
            </Link>
          </div>
        </div>

        {/* Companies by Category */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Companies by Category</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byCategory.items.slice(0, 12).map((c) => (
              <Link
                key={c.mca_category}
                href={`/companies?mca_category=${encodeURIComponent(c.mca_category)}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="truncate pr-4 text-gray-800 dark:text-gray-100">{c.mca_category}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{c.count.toLocaleString()}</span>
              </Link>
            ))}
            <Link href="/categories" className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800/50">
              View more categories →
            </Link>
          </div>
        </div>

        {/* Companies by Paid-up Capital */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Companies by Paid-up Capital</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byPaidUp.items.map((b) => {
              const href = `/companies?p_capital_min=${b.min ?? 0}${b.max ? `&p_capital_max=${b.max}` : ""}`;
              return (
                <Link
                  key={b.label}
                  href={href}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <span className="truncate pr-4 text-gray-800 dark:text-gray-100">{b.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{b.count.toLocaleString()}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      </main>
    </AuthGuard>
  );
}
