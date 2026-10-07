import { serverApiBase } from "./apiBase";

const API_BASE = serverApiBase();

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export type Page<T> = {
  total: number;
  limit: number;
  offset: number;
  items: T[];
};

export type Company = {
  cin: string;
  companyname?: string;
  city?: string;
  state?: string;
  a_capital?: number;
  p_capital?: number;
  company_email?: string;
  phone?: string;
  toc?: string | number;
  created_at?: string;
  mca_category?: string;
  division_description?: string;
  dor?: string;
  contacted?: boolean;
};

export type Director = {
  din: string;
  director_name?: string;
  designation?: string;
  date_joined?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  companyname?: string;
  cin?: string;
  city?: string;
};

export type Summary = {
  total_companies: number;
  total_directors: number;
};