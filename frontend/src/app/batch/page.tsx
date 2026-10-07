import Link from "next/link";
import { ArrowLeft, Building2, Users, Download, CheckCircle } from "lucide-react";
import { CanDownload } from "@/components/DownloadButton";

export default async function BatchOperationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Batch Operations
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Select companies, view their directors, and perform bulk actions
          </p>
        </div>

        {/* Workflow Cards */}
        <div className="grid gap-6">
          {/* Step 1: Select Companies */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-medium opacity-90">Step 1</div>
                  <h2 className="text-2xl font-bold">Select Companies</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-neutral-400 mb-4">
                Browse and select multiple companies using filters and search. Build your target list for director analysis.
              </p>
              <Link
                href="/batch/select-companies"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Start Selection
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>

          {/* Step 2: View Directors */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-medium opacity-90">Step 2</div>
                  <h2 className="text-2xl font-bold">View & Select Directors</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-neutral-400 mb-4">
                Review all directors from your selected companies and choose who to follow up with.
              </p>
              <div className="text-sm text-gray-500 dark:text-neutral-500 italic">
                Available after selecting companies in Step 1
              </div>
            </div>
          </div>

          {/* Step 3: Export & Mark */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-medium opacity-90">Step 3</div>
                  <h2 className="text-2xl font-bold">Follow Up</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-neutral-400 mb-4">
                Mark directors as contacted for follow-up tracking.
              </p>
              <CanDownload>
                <p className="text-gray-600 dark:text-neutral-400 mb-4">
                  Download selected directors&apos; details to Excel with complete contact information.
                </p>
              </CanDownload>
              <div className="flex gap-3 flex-wrap">
                <CanDownload>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                    <Download className="w-4 h-4" />
                    Export to Excel
                  </div>
                </CanDownload>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                  <CheckCircle className="w-4 h-4" />
                  Mark as Contacted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">💡 Quick Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Use filters to narrow down companies by state, city, or capital range</li>
            <li>• Your selections persist as you navigate through the workflow</li>
            <CanDownload>
              <li>• Export includes all contact details: phone numbers, emails, and company information</li>
            </CanDownload>
            <li>• Mark directors as contacted to track your outreach progress</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
