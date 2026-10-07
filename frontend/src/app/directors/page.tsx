import Link from "next/link";
import { apiGet, Director, Page } from "@/lib/api";
import SaveViewClient from "./save-view-client";
import { formatIndianCurrency } from "@/lib/formatters";
import { DownloadButton } from "@/components/DownloadButton";

export default async function DirectorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (sp?.q as string) || "";
  const designation = (sp?.designation as string) || "";
  const contacted = (sp?.contacted as string) || "";
  const doj_from = (sp?.doj_from as string) || "";
  const doj_to = (sp?.doj_to as string) || "";
  const limit = 20;
  const offset = Number(sp?.offset || 0);

  const qs = [
    `limit=${limit}`,
    `offset=${offset}`,
    q && `q=${encodeURIComponent(q)}`,
    designation && `designation=${encodeURIComponent(designation)}`,
    contacted && `contacted=${encodeURIComponent(contacted)}`,
    doj_from && `doj_from=${encodeURIComponent(doj_from)}`,
    doj_to && `doj_to=${encodeURIComponent(doj_to)}`,
  ].filter(Boolean).join("&");

  const data = await apiGet<Page<Director>>(`/api/directors?${qs}`);

  const active: Array<[string, string]> = [];
  if (q) active.push(["q", q]);
  if (designation) active.push(["designation", designation]);
  if (contacted) active.push(["contacted", contacted]);
  if (doj_from) active.push(["doj_from", doj_from]);
  if (doj_to) active.push(["doj_to", doj_to]);

  const prettyLabel = (k: string) => {
    switch (k) {
      case "q": return "Query";
      case "designation": return "Designation";
      case "contacted": return "Contacted";
      case "doj_from": return "Joined From";
      case "doj_to": return "Joined To";
      default: return k;
    }
  };
  const prettyValue = (k: string, v: string) => k === "contacted" ? (v === "true" ? "Yes" : v === "false" ? "No" : v) : v;
  const buildUrlExcluding = (excludeKey: string) => {
    const pairs = [
      ["q", q],
      ["designation", designation],
      ["contacted", contacted],
      ["doj_from", doj_from],
      ["doj_to", doj_to],
    ] as Array<[string, string]>;
    const qs2 = pairs.filter(([k, v]) => k !== excludeKey && v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return `/directors${qs2 ? `?${qs2}` : ""}`;
  };

  return (
    <main className="mx-auto w-full max-w-[1800px] px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Directors</h1>
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
            <Link href="/directors" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-gray-600 transition hover:bg-gray-50 dark:border-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-800">
              Reset all
            </Link>
          </div>
        </div>
      )}

      <div id="filters" className="mt-4 flex gap-2 scroll-mt-20">
        <form className="flex w-full flex-col gap-3" action="/directors" method="get">
          <div className="flex w-full gap-2">
            <input name="q" defaultValue={q} placeholder="Search by name or DIN" className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
            <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Search</button>
            <Link href="/directors" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800">Clear</Link>
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
              <input name="designation" defaultValue={designation} placeholder="Designation" title="Director designation (e.g., Director, Managing Director)" className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              <select name="contacted" defaultValue={contacted} title="Filter by whether this director/company has been contacted." className="rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                <option value="">Contacted (any)</option>
                <option value="true">Contacted: Yes</option>
                <option value="false">Contacted: No</option>
              </select>
              <div className="flex items-center gap-2" title="Include directors who joined on or after this date.">
                <label className="text-gray-700 dark:text-gray-300">Joined from</label>
                <input type="date" name="doj_from" defaultValue={doj_from} className="rounded-md border border-gray-300 bg-white px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-2" title="Include directors who joined on or before this date.">
                <label className="text-gray-700 dark:text-gray-300">Joined to</label>
                <input type="date" name="doj_to" defaultValue={doj_to} className="rounded-md border border-gray-300 bg-white px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
              </div>
            </div>
          </details>
        </form>
        <SaveViewClient currentFilters={{ q, designation, contacted, doj_from, doj_to }} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">DIN</th>
              <th className="whitespace-nowrap px-4 py-3">Name</th>
              <th className="whitespace-nowrap px-4 py-3">Company</th>
              <th className="whitespace-nowrap px-4 py-3">City</th>
              <th className="whitespace-nowrap px-4 py-3">Date Joined</th>
              <th className="whitespace-nowrap px-4 py-3">Phone</th>
              <th className="whitespace-nowrap px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((d) => (
              <tr key={d.din} className="border-t border-gray-100 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-indigo-600"><Link href={`/directors/${d.din}`}>{d.din}</Link></td>
                <td className="whitespace-nowrap px-4 py-3">{d.director_name}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {d.cin ? (
                    <Link href={`/companies/${d.cin}`} className="text-indigo-600 hover:underline">
                      {d.companyname}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{d.city || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{d.date_joined}</td>
                <td className="whitespace-nowrap px-4 py-3">{d.phone}</td>
                <td className="whitespace-nowrap px-4 py-3">{d.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2 text-sm">
        <DownloadButton
          path={`/api/export/directors.csv?${[
            q && `q=${encodeURIComponent(q)}`,
            designation && `designation=${encodeURIComponent(designation)}`,
            contacted && `contacted=${encodeURIComponent(contacted)}`,
            doj_from && `doj_from=${encodeURIComponent(doj_from)}`,
            doj_to && `doj_to=${encodeURIComponent(doj_to)}`,
          ].filter(Boolean).join("&")}`}
          filename="directors.csv"
          label="Export CSV"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <div>Showing {data.items.length} of {formatIndianCurrency(data.total)}</div>
        <div className="flex gap-2">
          {offset > 0 && (
            <Link className="rounded-md border px-3 py-1 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800" href={`/directors?${[
              `offset=${Math.max(offset - limit, 0)}`,
              q && `q=${encodeURIComponent(q)}`,
              designation && `designation=${encodeURIComponent(designation)}`,
              contacted && `contacted=${encodeURIComponent(contacted)}`,
              doj_from && `doj_from=${encodeURIComponent(doj_from)}`,
              doj_to && `doj_to=${encodeURIComponent(doj_to)}`,
            ].filter(Boolean).join("&")}`}>Prev</Link>
          )}
          {offset + limit < data.total && (
            <Link className="rounded-md border px-3 py-1 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800" href={`/directors?${[
              `offset=${offset + limit}`,
              q && `q=${encodeURIComponent(q)}`,
              designation && `designation=${encodeURIComponent(designation)}`,
              contacted && `contacted=${encodeURIComponent(contacted)}`,
              doj_from && `doj_from=${encodeURIComponent(doj_from)}`,
              doj_to && `doj_to=${encodeURIComponent(doj_to)}`,
            ].filter(Boolean).join("&")}`}>Next</Link>
          )}
        </div>
      </div>
    </main>
  );
}
