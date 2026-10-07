"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SHOW_DELAY_MS = 150;
const NAV_TIMEOUT_MS = 30000;

function isApiRequest(input: RequestInfo | URL): boolean {
  try {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return new URL(raw, window.location.href).pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

export default function BusyIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const startNav = () => {
      setNavigating(true);
      if (navTimer.current) clearTimeout(navTimer.current);
      navTimer.current = setTimeout(() => setNavigating(false), NAV_TIMEOUT_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      startNav();
    };

    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      const form = e.target as HTMLFormElement;
      if (form.getAttribute("action")) startNav();
    };

    const onPageShow = () => setNavigating(false);

    // Capture phase: next/link calls preventDefault in its own handler before bubbling reaches us.
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("pageshow", onPageShow);

    // Client components call fetch directly; count in-flight API calls globally.
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isApiRequest(input)) return originalFetch(input, init);
      setPending((n) => n + 1);
      try {
        return await originalFetch(input, init);
      } finally {
        setPending((n) => Math.max(0, n - 1));
      }
    };

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("pageshow", onPageShow);
      window.fetch = originalFetch;
      if (navTimer.current) clearTimeout(navTimer.current);
    };
  }, []);

  const busy = navigating || pending > 0;

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [busy]);

  if (!visible) return null;

  return (
    <>
      <div className="busy-bar fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-indigo-100 dark:bg-indigo-950" aria-hidden="true">
        <div className="busy-bar-inner h-full w-1/3 bg-indigo-600" />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-sm text-gray-700 shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-gray-200"
      >
        <svg className="h-4 w-4 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        Loading…
      </div>
    </>
  );
}
