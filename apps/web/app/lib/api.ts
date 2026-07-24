const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  json?: unknown;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

async function tryRefreshToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) throw new Error('Refresh failed');

  const data = await res.json();
  const newAccess = data.data?.accessToken || data.accessToken;
  const newRefresh = data.data?.refreshToken || data.refreshToken;
  setTokens(newAccess, newRefresh || refresh);
  return newAccess;
}

async function apiFetch<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers: customHeaders, ...rest } = options;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (json) {
    headers['Content-Type'] = 'application/json';
    rest.body = JSON.stringify(json);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...rest, headers });

  if (res.status === 401 && token) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(`${API_BASE}${endpoint}`, { ...rest, headers }).then((r) => r.json() as Promise<T>);
      });
    }

    isRefreshing = true;
    try {
      const newToken = await tryRefreshToken();
      processQueue(null, newToken);
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...rest, headers });
    } catch (err) {
      processQueue(err, null);
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/connexion';
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Erreur API');
  }

  return (data.data !== undefined ? data.data : data) as T;
}

async function apiUpload<T = unknown>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
  let token = getAccessToken();
  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });

  if (res.status === 401 && token) {
    token = await tryRefreshToken();
    headers['Authorization'] = `Bearer ${token}`;
    res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur upload');
  return (data.data !== undefined ? data.data : data) as T;
}

async function apiFormData<T = unknown>(endpoint: string, method: string, formData: FormData): Promise<T> {
  let token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: formData });

  if (res.status === 401 && token) {
    token = await tryRefreshToken();
    headers['Authorization'] = `Bearer ${token}`;
    res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: formData });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur API');
  return (data.data !== undefined ? data.data : data) as T;
}

export const api = {
  get: <T = unknown>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T = unknown>(endpoint: string, json?: unknown) => apiFetch<T>(endpoint, { method: 'POST', json }),
  patch: <T = unknown>(endpoint: string, json?: unknown) => apiFetch<T>(endpoint, { method: 'PATCH', json }),
  delete: <T = unknown>(endpoint: string, json?: unknown) => apiFetch<T>(endpoint, { method: 'DELETE', json }),
  upload: apiUpload,
  postFormData: <T = unknown>(endpoint: string, formData: FormData) => apiFormData<T>(endpoint, 'POST', formData),
  patchFormData: <T = unknown>(endpoint: string, formData: FormData) => apiFormData<T>(endpoint, 'PATCH', formData),
  streamUrl(trackId: string, download = false): string {
    const token = getAccessToken();
    let url = `/api/music/stream/${trackId}`;
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (download) params.set('download', 'true');
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  },
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
};

export type { Track, ArtistProfile, Album, Playlist, User, PaginatedResponse } from './types';
