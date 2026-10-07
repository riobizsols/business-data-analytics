import { apiGet } from "@/lib/api";
import Link from "next/link";
import { formatIndianCurrency } from "@/lib/formatters";

export default async function CompanyDetailPage({ params }: { params: Promise<{ cin: string }> }) {
  const { cin } = await params;
  const data = await apiGet<{ company: any; directors: any[] }>(`/api/companies/${cin}`);
  const { company, directors } = data;
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/companies" className="text-sm text-indigo-600">← Back to companies</Link>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{company.companyname}</h1>
      <div className="mt-1 font-mono text-xs text-gray-500">{company.cin}</div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border p-4 dark:border-neutral-800">
          <div className="text-sm text-gray-600 dark:text-gray-300">Location</div>
          <div className="mt-2 text-gray-900 dark:text-white">{company.city}, {company.state}, {company.country}</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Registered office:</div>
          <div className="text-sm text-gray-900 dark:text-gray-200">{company.reg_off_addr}</div>
        </div>
        <div className="rounded-xl border p-4 dark:border-neutral-800">
          <div className="text-sm text-gray-600 dark:text-gray-300">Capital</div>
          <div className="mt-2 text-gray-900 dark:text-white">Authorized: {formatIndianCurrency(company.a_capital)} | Paid-up: {formatIndianCurrency(company.p_capital)}</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Activity</div>
          <div className="text-gray-900 dark:text-white">{company.activity_code} — {company.activity_description}</div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Directors</h2>
        <div className="mt-3 overflow-hidden rounded-xl border dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">DIN</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {directors.map((d) => (
                <tr key={d.din} className="border-t border-gray-100 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600"><Link href={`/directors/${d.din}`}>{d.din}</Link></td>
                  <td className="px-4 py-3">{d.director_name}</td>
                  <td className="px-4 py-3">{d.designation}</td>
                  <td className="px-4 py-3">{d.date_joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
