"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiBase";

type SavedView = { id: number; name: string; scope: string; filters: Record<string, any> };

export default function SaveViewClient({ currentFilters }: { currentFilters: Record<string, any> }) {
  const router = useRouter();
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => {
    fetch(apiUrl("/api/views?scope=companies")).then(r => r.json()).then(setViews).catch(() => {});
  }, []);

  const saveView = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/views"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scope: "companies", filters: currentFilters }),
      });
      if (res.ok) {
        const v = await res.json();
        setViews([v, ...views]);
        setName("");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyView = (v: SavedView) => {
    const params = new URLSearchParams();
    Object.entries(v.filters || {}).forEach(([k, val]) => {
      if (val !== undefined && val !== null && String(val) !== "") params.set(k, String(val));
    });
    router.push(`/companies?${params.toString()}`);
  };

  const renameView = async (v: SavedView) => {
    const newName = prompt("Rename view", v.name);
    if (!newName || newName.trim() === v.name) return;
    const res = await fetch(apiUrl(`/api/views/${v.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setViews(views.map(x => x.id === v.id ? updated : x));
    }
  };

  const deleteView = async (v: SavedView) => {
    if (!confirm(`Delete view "${v.name}"?`)) return;
    const res = await fetch(apiUrl(`/api/views/${v.id}`), { method: "DELETE" });
    if (res.ok) setViews(views.filter(x => x.id !== v.id));
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="View name" className="w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" />
      <button onClick={saveView} disabled={loading} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800">Save View</button>
      <div className="relative">
        <select onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedId(Number.isFinite(id) ? id : null);
          const v = views.find(x => x.id === id);
          if (v) applyView(v);
        }} className="rounded-md border px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-white" value={selectedId ?? "" as any}>
          <option value="">Saved Views</option>
          {views.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      {/* Inline actions for selected view */}
      {selectedId && (
        <div className="flex gap-1">
          <button type="button" onClick={() => {
            const v = views.find(x => x.id === selectedId); if (v) renameView(v);
          }} className="rounded-md border px-2 py-2 text-xs hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800">Rename</button>
          <button type="button" onClick={() => {
            const v = views.find(x => x.id === selectedId); if (v) deleteView(v);
          }} className="rounded-md border px-2 py-2 text-xs hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800">Delete</button>
        </div>
      )}
    </div>
  );
}
