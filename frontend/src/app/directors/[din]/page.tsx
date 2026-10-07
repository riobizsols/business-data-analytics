import Link from "next/link";
import { apiGet } from "@/lib/api";

export default async function DirectorDetailPage({ params }: { params: Promise<{ din: string }> }) {
  const { din } = await params;
  const data = await apiGet<{ director: any; companies: any[] }>(`/api/directors/${din}`);
  const { director, companies } = data;
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/directors" className="text-sm text-indigo-600">← Back to directors</Link>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{director.director_name}</h1>
      <div className="mt-1 font-mono text-xs text-gray-500">DIN: {director.din}</div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border p-4 dark:border-neutral-800">
          <div className="text-sm text-gray-600 dark:text-gray-300">Designation</div>
          <div className="mt-2 text-gray-900 dark:text-white">{director.designation}</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Date Joined</div>
          <div className="text-gray-900 dark:text-white">{director.date_joined}</div>
        </div>
        <div className="rounded-xl border p-4 dark:border-neutral-800">
          <div className="text-sm text-gray-600 dark:text-gray-300">Contact Information</div>
          {director.mobiles && director.mobiles.length > 0 && (
            <>
              <div className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-400">Mobile Numbers:</div>
              <div className="text-gray-900 dark:text-white">
                {director.mobiles.map((mobile: string, idx: number) => (
                  <div key={idx} className="text-sm">{mobile}</div>
                ))}
              </div>
            </>
          )}
          {director.emails && director.emails.length > 0 && (
            <>
              <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-400">Email Addresses:</div>
              <div className="text-gray-900 dark:text-white">
                {director.emails.map((email: string, idx: number) => (
                  <div key={idx} className="text-sm break-all">{email}</div>
                ))}
              </div>
            </>
          )}
          {(!director.mobiles || director.mobiles.length === 0) && (!director.emails || director.emails.length === 0) && (
            <div className="mt-2 text-sm text-gray-500 italic">No contact information available</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Companies</h2>
        <div className="mt-3 overflow-hidden rounded-xl border dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">CIN</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.cin} className="border-t border-gray-100 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600"><Link href={`/companies/${c.cin}`}>{c.cin}</Link></td>
                  <td className="px-4 py-3">{c.companyname}</td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3">{c.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
