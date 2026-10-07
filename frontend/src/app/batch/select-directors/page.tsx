"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, CheckCircle, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userCanDownload } from "@/components/DownloadButton";
import { apiUrl } from "@/lib/apiBase";

interface Director {
  din: string;
  director_name: string;
  designation: string;
  date_joined?: string;
  phone?: string;
  email?: string;
  contacted?: boolean;
  companyname?: string;
  cin?: string;
  city?: string;
  state?: string;
}

export default function SelectDirectorsPage() {
  return (
    <Suspense fallback={null}>
      <SelectDirectorsContent />
    </Suspense>
  );
}

function SelectDirectorsContent() {
  const searchParams = useSearchParams();
  const cins = searchParams?.get("cins") || "";
  const { user, token } = useAuth();
  const canDownload = userCanDownload(user);
  
  const [directors, setDirectors] = useState<Director[]>([]);
  const [selectedDins, setSelectedDins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load saved selections
  useEffect(() => {
    const saved = localStorage.getItem("selectedDirectorDins");
    if (saved) {
      setSelectedDins(new Set(JSON.parse(saved)));
    }
  }, []);

  // Fetch directors for selected companies
  useEffect(() => {
    if (!cins) {
      setLoading(false);
      return;
    }

    fetch(apiUrl(`/api/batch/directors/by-companies?cins=${encodeURIComponent(cins)}`))
      .then((res) => res.json())
      .then((data) => {
        setDirectors(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [cins]);

  const toggleSelection = (din: string) => {
    const newSet = new Set(selectedDins);
    if (newSet.has(din)) {
      newSet.delete(din);
    } else {
      newSet.add(din);
    }
    setSelectedDins(newSet);
    localStorage.setItem("selectedDirectorDins", JSON.stringify([...newSet]));
  };

  const selectAll = () => {
    const newSet = new Set(directors.map((d) => d.din));
    setSelectedDins(newSet);
    localStorage.setItem("selectedDirectorDins", JSON.stringify([...newSet]));
  };

  const clearSelection = () => {
    setSelectedDins(new Set());
    localStorage.removeItem("selectedDirectorDins");
  };

  const markAsContacted = async () => {
    if (selectedDins.size === 0) return;

    setMarking(true);
    try {
      const response = await fetch(apiUrl("/api/batch/directors/mark-contacted"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dins: Array.from(selectedDins) }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully marked ${result.directors_updated} directors and ${result.companies_updated} companies as contacted!`);
        // Refresh directors list
        window.location.reload();
      } else {
        alert("Failed to mark directors as contacted");
      }
    } catch (error) {
      console.error(error);
      alert("Error marking directors as contacted");
    } finally {
      setMarking(false);
    }
  };

  const exportToExcel = async () => {
    if (selectedDins.size === 0 || !canDownload) return;

    setExporting(true);
    try {
      const dins = Array.from(selectedDins).join(",");
      const res = await fetch(
        apiUrl(`/api/batch/directors/export-selected?dins=${encodeURIComponent(dins)}`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) {
        alert("Download is not allowed for this account");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selected_directors.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!cins) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Companies Selected
            </h1>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              Please select companies first to view their directors.
            </p>
            <Link
              href="/batch/select-companies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Company Selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/batch/select-companies"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Company Selection
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Step 2: Select Directors
          </h1>
          <p className="text-gray-600 dark:text-neutral-400 mt-1">
            {directors.length} directors from {cins.split(",").length} companies | {selectedDins.size} selected
          </p>
        </div>

        {/* Action Bar */}
        {selectedDins.size > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-4 mb-6">
            <div className="flex gap-4 items-center flex-wrap">
              <span className="font-medium text-gray-700 dark:text-neutral-300">
                {selectedDins.size} directors selected
              </span>
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={markAsContacted}
                  disabled={marking}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  {marking ? "Marking..." : "Mark as Contacted"}
                </button>
                {canDownload && (
                  <button
                    onClick={exportToExcel}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? "Exporting..." : "Export to Excel"}
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selection Controls */}
        {!loading && directors.length > 0 && (
          <div className="mb-4 flex gap-3">
            <button
              onClick={selectAll}
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950"
            >
              Select All ({directors.length})
            </button>
            {selectedDins.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Deselect All
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    <input
                      type="checkbox"
                      checked={directors.length > 0 && directors.every((d) => selectedDins.has(d.din))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAll();
                        } else {
                          clearSelection();
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    DIN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    City
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Contacted
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Loading directors...
                    </td>
                  </tr>
                ) : directors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No directors found for selected companies
                    </td>
                  </tr>
                ) : (
                  directors.map((director) => (
                    <tr
                      key={director.din}
                      className={`border-t border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer ${
                        selectedDins.has(director.din) ? "bg-indigo-50 dark:bg-indigo-950/20" : ""
                      }`}
                      onClick={() => toggleSelection(director.din)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedDins.has(director.din)}
                          onChange={() => {}}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600">
                        {director.din}
                      </td>
                      <td className="px-4 py-3 font-medium">{director.director_name}</td>
                      <td className="px-4 py-3 text-sm">{director.companyname}</td>
                      <td className="px-4 py-3 text-sm" title={director.state || ''}>{director.city || "—"}</td>
                      <td className="px-4 py-3 text-sm">{director.phone || "—"}</td>
                      <td className="px-4 py-3 text-sm">{director.email || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {director.contacted ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        {directors.length > 0 && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Next Steps:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Select directors you want to follow up with</li>
                  {canDownload && (
                    <li>Use &quot;Export to Excel&quot; to download complete details with all contact information</li>
                  )}
                  <li>Use "Mark as Contacted" to track your outreach progress</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
