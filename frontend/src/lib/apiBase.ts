/** Browser API origin. Empty means the same host (used behind the deploy proxy). */
export function browserApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE;
  if (configured) return configured.replace(/\/$/, "");
  return "";
}

export function apiUrl(path: string): string {
  return `${browserApiBase()}${path}`;
}

/** Server-side API origin. Read dynamically so Docker can set it at runtime. */
export function serverApiBase(): string {
  const env = process.env;
  const internal = env["API_INTERNAL_BASE"];
  if (internal) return internal.replace(/\/$/, "");
  const pub = env["NEXT_PUBLIC_API_BASE"];
  if (pub) return pub.replace(/\/$/, "");
  return "http://127.0.0.1:8000";
}
