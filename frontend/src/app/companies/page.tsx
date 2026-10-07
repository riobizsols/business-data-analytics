import Link from "next/link";
import { apiGet, Company, Page } from "@/lib/api";
import SaveViewClient from "./save-view-client";
import { formatIndianCurrency } from "@/lib/formatters";
import { DownloadButton } from "@/components/DownloadButton";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (sp?.q as string) || "";
  const state = (sp?.state as string) || "";
  const mca_category = (sp?.mca_category as string) || "";
  const a_capital_min = (sp?.a_capital_min as string) || "";
  const a_capital_max = (sp?.a_capital_max as string) || "";
  const p_capital_min = (sp?.p_capital_min as string) || "";
  const p_capital_max = (sp?.p_capital_max as string) || "";
  const dor_from = (sp?.dor_from as string) || ""; // YYYY-MM-DD
  const dor_to = (sp?.dor_to as string) || "";     // YYYY-MM-DD
  const contacted = (sp?.contacted as string) || ""; // "true" | "false" | ""

  const limit = 20;
  const offset = Number(sp?.offset || 0);

  // Fetch states for dropdown
  const statesData = await apiGet<{states: string[]}>("/api/companies/meta/states");
  const states = statesData.states;

  // Fetch categories for dropdown
  const categoriesData = await apiGet<{categories: string[]}>("/api/companies/meta/categories");
  const categories = categoriesData.categories;

  const qs = [
    `limit=${limit}`,
    `offset=${offset}`,
    q && `q=${encodeURIComponent(q)}`,
    state && `state=${encodeURIComponent(state)}`,
    mca_category && `mca_category=${encodeURIComponent(mca_category)}`,
    a_capital_min && `a_capital_min=${encodeURIComponent(a_capital_min)}`,
    a_capital_max && `a_capital_max=${encodeURIComponent(a_capital_max)}`,
    p_capital_min && `p_capital_min=${encodeURIComponent(p_capital_min)}`,
    p_capital_max && `p_capital_max=${encodeURIComponent(p_capital_max)}`,
    dor_from && `dor_from=${encodeURIComponent(dor_from)}`,
    dor_to && `dor_to=${encodeURIComponent(dor_to)}`,
    contacted && `contacted=${encodeURIComponent(contacted)}`,
  ].filter(Boolean).join("&");

  const data = await apiGet<Page<Company>>(`/api/companies?${qs}`);

  const active: Array<[string, string]> = [];
  if (q) active.push(["q", q]);
  if (state) active.push(["state", state]);
  if (mca_category) active.push(["mca_category", mca_category]);
  if (a_capital_min) active.push(["a_capital_min", a_capital_min]);
  if (a_capital_max) active.push(["a_capital_max", a_capital_max]);
  if (p_capital_min) active.push(["p_capital_min", p_capital_min]);
  if (p_capital_max) active.push(["p_capital_max", p_capital_max]);
  if (dor_from) active.push(["dor_from", dor_from]);
  if (dor_to) active.push(["dor_to", dor_to]);
  if (contacted) active.push(["contacted", contacted]);

  const prettyLabel = (k: string) => {
    switch (k) {
      case "q": return "Query";
      case "state": return "State";
      case "mca_category": return "Category";
      case "a_capital_min": return "Auth Cap ≥";
      case "a_capital_max": return "Auth Cap ≤";
      case "p_capital_min": return "Paid-up ≥";
      case "p_capital_max": return "Paid-up ≤";
      case "dor_from": return "Reg From";
      case "dor_to": return "Reg To";
      case "contacted": return "Contacted";
      default: return k;
    }
  };

  const prettyValue = (k: string, v: string) => {
    if (k === "contacted") return v === "true" ? "Yes" : v === "false" ? "No" : v;
    return v;
  };

  const buildUrlExcluding = (excludeKey: string) => {
    const pairs = [
      ["q", q],
      ["state", state],
      ["mca_category", mca_category],
      ["a_capital_min", a_capital_min],
      ["a_capital_max", a_capital_max],
      ["p_capital_min", p_capital_min],
      ["p_capital_max", p_capital_max],
      ["dor_from", dor_from],
      ["dor_to", dor_to],
      ["contacted", contacted],
    ] as Array<[string, string]>;
    const qs2 = pairs
      .filter(([k, v]) => k !== excludeKey && v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return `/companies${qs2 ? `?${qs2}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Companies</h1>
      {/* Sticky compact filter bar */}
      {active.length > 0 && (
        <div className="sticky top-0 z-20 -mx-6 mt-3 border-b bg-white/80 px-6 py-2 text-xs backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-600 dark:text-gray-300">Filters:</span>
            {active.map(([k, v]) => (
              <span key={`sticky-${k}`} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50/70 px-2 py-1 text-indigo-800 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                <span className="font-medium">{prettyLabel(k)}:</span>
                <span className="max-w-[9rem] truncate" title={prettyValue(k, v)}>{prettyValue(k, v)}</span>
                <Link aria-label={`Remove ${k}`} href={buildUrlExcluding(k)} className="ml-0.5 rounded-full p-0.5 text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 5.23a.75.75 0 0 1 1.06 0L10 8.94l3.71-3.71a.75.75 0 1 1 1.06 1.06L11.06 10l3.71 3.71a.75.75 0 1 1-1.06 1.06L10 11.06l-3.71 3.71a.75.75 0 1 1-1.06-1.06L8.94 10 5.23 6.29a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                  </svg>
                </Link>
              </span>
            ))}
            <Link href="#filters" className="ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-gray-600 transition hover:bg-gray-50 dark:border-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-800">
              Edit filters
            </Link>
            <Link href="/companies" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-gray-600 transition hover:bg-gray-50 dark:border-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-800">
              Reset all
            </Link>
          </div>
        </div>
      )}

      <div id="filters" className="mt-4 flex gap-2 scroll-mt-20">
        <form className="flex w-full flex-col gap-3" action="/companies" method="get">
          <div className="flex w-full gap-2">
            <input name="q" defaultValue={q} placeholder="Search by name or CIN" className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
            <select name="state" defaultValue={state} className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Search</button>
            <Link href="/companies" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800">Clear</Link>
          </div>
          <details className="group rounded-lg border text-sm dark:border-neutral-800" role="group">
            <summary className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 font-medium text-gray-800 outline-none transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-neutral-800/50 marker:hidden">
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1-.02-1.06L10.35 10 7.2 6.29a.75.75 0 1 1 1.1-1.02l3.5 3.75a.75.75 0 0 1 0 1.02l-3.5 3.75a.75.75 0 0 1-1.1-.02z" clipRule="evenodd" />
                </svg>
                Advanced filters
              </span>
              <span className="text-xs text-gray-500">{active.length} active</span>
            </summary>
            <div className="grid grid-cols-1 gap-2 overflow-hidden border-t p-3 pt-3 opacity-0 transition-all duration-300 ease-in-out max-h-0 group-open:max-h-[900px] group-open:opacity-100 dark:border-neutral-800 sm:grid-cols-2 lg:grid-cols-3">
              <select name="mca_category" defaultValue={mca_category} title="Filter by MCA category" className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input name="a_capital_min" defaultValue={a_capital_min} placeholder="Authorized capital min" title="Minimum authorized capital (INR)." inputMode="numeric" className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              <input name="a_capital_max" defaultValue={a_capital_max} placeholder="Authorized capital max" title="Maximum authorized capital (INR)." inputMode="numeric" className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              <input name="p_capital_min" defaultValue={p_capital_min} placeholder="Paid-up capital min" title="Minimum paid-up capital (INR)." inputMode="numeric" className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              <input name="p_capital_max" defaultValue={p_capital_max} placeholder="Paid-up capital max" title="Maximum paid-up capital (INR)." inputMode="numeric" className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              <div className="flex items-center gap-2" title="Only include companies registered on or after this date.">
                <label className="text-gray-700 dark:text-gray-300">Registered from</label>
                <input type="date" name="dor_from" defaultValue={dor_from} className="rounded-md border border-gray-300 bg-white px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-2" title="Only include companies registered on or before this date.">
                <label className="text-gray-700 dark:text-gray-300">Registered to</label>
                <input type="date" name="dor_to" defaultValue={dor_to} className="rounded-md border border-gray-300 bg-white px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              </div>
              <select name="contacted" defaultValue={contacted} title="Filter by whether this company has been contacted." className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                <option value="">Contacted (any)</option>
                <option value="true">Contacted: Yes</option>
                <option value="false">Contacted: No</option>
              </select>
            </div>
          </details>
        </form>
        <SaveViewClient currentFilters={{ q, state, mca_category, a_capital_min, a_capital_max, p_capital_min, p_capital_max, dor_from, dor_to, contacted }} />
      </div>


      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">CIN</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Auth Capital</th>
              <th className="px-4 py-3 text-right">Paid Capital</th>
              <th className="px-4 py-3 text-center">TOC</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <tr key={c.cin} className="border-t border-gray-100 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 font-mono text-xs text-indigo-600"><Link title="View directors of this company" href={`/directors?q=${encodeURIComponent(c.cin)}`}>{c.cin}</Link></td>
                <td className="px-4 py-3">{c.companyname}</td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3">{c.state}</td>
                <td className="px-4 py-3" title={c.division_description || ''}>{c.mca_category || '—'}</td>
                <td className="px-4 py-3">{c.company_email}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-right">{formatIndianCurrency(c.a_capital)}</td>
                <td className="px-4 py-3 text-right">{formatIndianCurrency(c.p_capital)}</td>
                <td className="px-4 py-3 text-center">{c.toc ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2 text-sm">
        <DownloadButton
          path={`/api/export/companies.csv?${[
            q && `q=${encodeURIComponent(q)}`,
            state && `state=${encodeURIComponent(state)}`,
            mca_category && `mca_category=${encodeURIComponent(mca_category)}`,
            a_capital_min && `a_capital_min=${encodeURIComponent(a_capital_min)}`,
            a_capital_max && `a_capital_max=${encodeURIComponent(a_capital_max)}`,
            p_capital_min && `p_capital_min=${encodeURIComponent(p_capital_min)}`,
            p_capital_max && `p_capital_max=${encodeURIComponent(p_capital_max)}`,
            dor_from && `dor_from=${encodeURIComponent(dor_from)}`,
            dor_to && `dor_to=${encodeURIComponent(dor_to)}`,
            contacted && `contacted=${encodeURIComponent(contacted)}`,
          ].filter(Boolean).join("&")}`}
          filename="companies.csv"
          label="Export CSV"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <div>Showing {data.items.length} of {formatIndianCurrency(data.total)}</div>
        <div className="flex gap-2">
          {offset > 0 && (
            <Link
              className="rounded-md border px-3 py-1 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
              href={`/companies?${[
                `offset=${Math.max(offset - limit, 0)}`,
                q && `q=${encodeURIComponent(q)}`,
                state && `state=${encodeURIComponent(state)}`,
                mca_category && `mca_category=${encodeURIComponent(mca_category)}`,
                a_capital_min && `a_capital_min=${encodeURIComponent(a_capital_min)}`,
                a_capital_max && `a_capital_max=${encodeURIComponent(a_capital_max)}`,
                p_capital_min && `p_capital_min=${encodeURIComponent(p_capital_min)}`,
                p_capital_max && `p_capital_max=${encodeURIComponent(p_capital_max)}`,
                dor_from && `dor_from=${encodeURIComponent(dor_from)}`,
                dor_to && `dor_to=${encodeURIComponent(dor_to)}`,
                contacted && `contacted=${encodeURIComponent(contacted)}`,
              ].filter(Boolean).join("&")}`}
            >Prev</Link>
          )}
          {offset + limit < data.total && (
            <Link
              className="rounded-md border px-3 py-1 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
              href={`/companies?${[
                `offset=${offset + limit}`,
                q && `q=${encodeURIComponent(q)}`,
                state && `state=${encodeURIComponent(state)}`,
                mca_category && `mca_category=${encodeURIComponent(mca_category)}`,
                a_capital_min && `a_capital_min=${encodeURIComponent(a_capital_min)}`,
                a_capital_max && `a_capital_max=${encodeURIComponent(a_capital_max)}`,
                p_capital_min && `p_capital_min=${encodeURIComponent(p_capital_min)}`,
                p_capital_max && `p_capital_max=${encodeURIComponent(p_capital_max)}`,
                dor_from && `dor_from=${encodeURIComponent(dor_from)}`,
                dor_to && `dor_to=${encodeURIComponent(dor_to)}`,
                contacted && `contacted=${encodeURIComponent(contacted)}`,
              ].filter(Boolean).join("&")}`}
            >Next</Link>
          )}
        </div>
      </div>
    </main>
  );
}
