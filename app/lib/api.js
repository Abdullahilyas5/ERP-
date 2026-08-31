const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('erp-token');
}

export function setStoredAuth(token, user) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    localStorage.setItem('erp-token', token);
    localStorage.setItem('erp-user', JSON.stringify(user));
    return;
  }

  localStorage.removeItem('erp-token');
  localStorage.removeItem('erp-user');
}

export function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const saved = localStorage.getItem('erp-user');
  return saved ? JSON.parse(saved) : null;
}

export async function apiFetch(path, options = {}) {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

export { API_BASE_URL };
