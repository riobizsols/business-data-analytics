"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, Filter, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { formatIndianCurrency } from "@/lib/formatters";
import { apiUrl } from "@/lib/apiBase";

interface Company {
  cin: string;
  companyname: string;
  city: string;
  state: string;
  a_capital?: number;
  p_capital?: number;
  toc?: string;
  company_email?: string;
  mca_category?: string;
  division_description?: string;
}

export default function SelectCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCins, setSelectedCins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [mcaCategory, setMcaCategory] = useState("");
  const [aCapitalMin, setACapitalMin] = useState("");
  const [aCapitalMax, setACapitalMax] = useState("");
  const [pCapitalMin, setPCapitalMin] = useState("");
  const [pCapitalMax, setPCapitalMax] = useState("");
  const [dorFrom, setDorFrom] = useState("");
  const [dorTo, setDorTo] = useState("");
  const [contacted, setContacted] = useState("");
  
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const limit = 20;

  // Load saved selections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedCompanyCins");
    if (saved) {
      setSelectedCins(new Set(JSON.parse(saved)));
    }
  }, []);

  // Fetch states for filter
  useEffect(() => {
    fetch(apiUrl("/api/companies/meta/states"))
      .then((res) => res.json())
      .then((data) => setStates(data.states || []))
      .catch(console.error);
  }, []);

  // Fetch categories for filter
  useEffect(() => {
    fetch(apiUrl("/api/companies/meta/categories"))
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  // Fetch companies
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: (page * limit).toString(),
    });
    if (searchQuery) params.set("q", searchQuery);
    if (stateFilter) params.set("state", stateFilter);
    if (mcaCategory) params.set("mca_category", mcaCategory);
    if (aCapitalMin) params.set("a_capital_min", aCapitalMin);
    if (aCapitalMax) params.set("a_capital_max", aCapitalMax);
    if (pCapitalMin) params.set("p_capital_min", pCapitalMin);
    if (pCapitalMax) params.set("p_capital_max", pCapitalMax);
    if (dorFrom) params.set("dor_from", dorFrom);
    if (dorTo) params.set("dor_to", dorTo);
    if (contacted) params.set("contacted", contacted);

    fetch(apiUrl(`/api/companies?${params}`))
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.items || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [searchQuery, stateFilter, mcaCategory, aCapitalMin, aCapitalMax, pCapitalMin, pCapitalMax, dorFrom, dorTo, contacted, page]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setStateFilter("");
    setMcaCategory("");
    setACapitalMin("");
    setACapitalMax("");
    setPCapitalMin("");
    setPCapitalMax("");
    setDorFrom("");
    setDorTo("");
    setContacted("");
    setPage(0);
  };

  const activeFiltersCount = [
    searchQuery,
    stateFilter,
    mcaCategory,
    aCapitalMin,
    aCapitalMax,
    pCapitalMin,
    pCapitalMax,
    dorFrom,
    dorTo,
    contacted,
  ].filter(Boolean).length;

  const toggleSelection = (cin: string) => {
    const newSet = new Set(selectedCins);
    if (newSet.has(cin)) {
      newSet.delete(cin);
    } else {
      newSet.add(cin);
    }
    setSelectedCins(newSet);
    localStorage.setItem("selectedCompanyCins", JSON.stringify([...newSet]));
  };

  const selectAll = () => {
    const newSet = new Set(selectedCins);
    companies.forEach((c) => newSet.add(c.cin));
    setSelectedCins(newSet);
    localStorage.setItem("selectedCompanyCins", JSON.stringify([...newSet]));
  };

  const clearSelection = () => {
    setSelectedCins(new Set());
    localStorage.removeItem("selectedCompanyCins");
  };

  const proceedToDirectors = () => {
    if (selectedCins.size > 0) {
      const cins = Array.from(selectedCins).join(",");
      window.location.href = `/batch/select-directors?cins=${encodeURIComponent(cins)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/batch"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-indigo-600 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Batch Operations
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Step 1: Select Companies
            </h1>
            <p className="text-gray-600 dark:text-neutral-400 mt-1">
              {selectedCins.size} companies selected
            </p>
          </div>
          {selectedCins.size > 0 && (
            <button
              onClick={proceedToDirectors}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              View Directors
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-4 mb-6">
          {/* Basic Filters Row */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Advanced {activeFiltersCount > 2 && `(${activeFiltersCount - 2})`}
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={selectAll}
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
            >
              Select All on Page
            </button>
            {selectedCins.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Clear All ({selectedCins.size})
              </button>
            )}
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Activity Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={mcaCategory}
                    onChange={(e) => {
                      setMcaCategory(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Authorized Capital Min */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Auth Capital Min
                  </label>
                  <input
                    type="number"
                    placeholder="Min amount"
                    value={aCapitalMin}
                    onChange={(e) => {
                      setACapitalMin(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>

                {/* Authorized Capital Max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Auth Capital Max
                  </label>
                  <input
                    type="number"
                    placeholder="Max amount"
                    value={aCapitalMax}
                    onChange={(e) => {
                      setACapitalMax(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>

                {/* Paid-up Capital Min */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Paid-up Capital Min
                  </label>
                  <input
                    type="number"
                    placeholder="Min amount"
                    value={pCapitalMin}
                    onChange={(e) => {
                      setPCapitalMin(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>

                {/* Paid-up Capital Max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Paid-up Capital Max
                  </label>
                  <input
                    type="number"
                    placeholder="Max amount"
                    value={pCapitalMax}
                    onChange={(e) => {
                      setPCapitalMax(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>

                {/* Registration Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Registered From
                  </label>
                  <input
                    type="date"
                    value={dorFrom}
                    onChange={(e) => {
                      setDorFrom(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>

                {/* Registration Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Registered To
                  </label>
                  <input
                    type="date"
                    value={dorTo}
                    onChange={(e) => {
                      setDorTo(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  />
                </div>

                {/* Contacted Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                    Contacted Status
                  </label>
                  <select
                    value={contacted}
                    onChange={(e) => {
                      setContacted(e.target.value);
                      setPage(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800 dark:text-white text-sm"
                  >
                    <option value="">All</option>
                    <option value="true">Contacted</option>
                    <option value="false">Not Contacted</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Pills */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-600 dark:text-neutral-400 self-center">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Query: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {stateFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    State: {stateFilter}
                    <button onClick={() => setStateFilter("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {mcaCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Category: {mcaCategory}
                    <button onClick={() => setMcaCategory("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {aCapitalMin && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Auth Cap ≥ {formatIndianCurrency(Number(aCapitalMin))}
                    <button onClick={() => setACapitalMin("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {aCapitalMax && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Auth Cap ≤ {formatIndianCurrency(Number(aCapitalMax))}
                    <button onClick={() => setACapitalMax("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {pCapitalMin && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Paid-up ≥ {formatIndianCurrency(Number(pCapitalMin))}
                    <button onClick={() => setPCapitalMin("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {pCapitalMax && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Paid-up ≤ {formatIndianCurrency(Number(pCapitalMax))}
                    <button onClick={() => setPCapitalMax("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {dorFrom && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    From: {dorFrom}
                    <button onClick={() => setDorFrom("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {dorTo && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    To: {dorTo}
                    <button onClick={() => setDorTo("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {contacted && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                    Contacted: {contacted === "true" ? "Yes" : "No"}
                    <button onClick={() => setContacted("")} className="hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    <input
                      type="checkbox"
                      checked={companies.length > 0 && companies.every((c) => selectedCins.has(c.cin))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAll();
                        } else {
                          const newSet = new Set(selectedCins);
                          companies.forEach((c) => newSet.delete(c.cin));
                          setSelectedCins(newSet);
                          localStorage.setItem("selectedCompanyCins", JSON.stringify([...newSet]));
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    CIN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Company Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    City
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    State
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    TOC
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Auth Capital
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                    Paid-up Capital
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr
                      key={company.cin}
                      className={`border-t border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer ${
                        selectedCins.has(company.cin) ? "bg-indigo-50 dark:bg-indigo-950/20" : ""
                      }`}
                      onClick={() => toggleSelection(company.cin)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCins.has(company.cin)}
                          onChange={() => {}}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600">
                        {company.cin}
                      </td>
                      <td className="px-4 py-3">{company.companyname}</td>
                      <td className="px-4 py-3">{company.city}</td>
                      <td className="px-4 py-3">{company.state}</td>
                      <td className="px-4 py-3" title={company.division_description || ''}>{company.mca_category || '—'}</td>
                      <td className="px-4 py-3">{company.toc || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {formatIndianCurrency(company.a_capital)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatIndianCurrency(company.p_capital)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > limit && (
            <div className="border-t border-gray-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border border-gray-300 dark:border-neutral-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * limit >= total}
                  className="px-3 py-1 border border-gray-300 dark:border-neutral-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
