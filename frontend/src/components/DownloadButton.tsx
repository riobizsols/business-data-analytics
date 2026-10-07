"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/apiBase";

type DownloadUser = {
  is_admin?: boolean;
  can_download?: boolean;
} | null;

export function userCanDownload(user: DownloadUser) {
  if (!user) return false;
  if (typeof user.can_download === "boolean") return user.can_download;
  return !!user.is_admin;
}

export function CanDownload({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading || !userCanDownload(user)) return null;
  return <>{children}</>;
}

export function DownloadButton({
  path,
  filename,
  label,
  className,
}: {
  path: string;
  filename: string;
  label: string;
  className?: string;
}) {
  const { user, token } = useAuth();
  if (!userCanDownload(user)) return null;

  const download = async () => {
    const res = await fetch(apiUrl(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      alert("Download is not allowed for this account");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className={className || "rounded-md border px-3 py-2 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"}
    >
      {label}
    </button>
  );
}
