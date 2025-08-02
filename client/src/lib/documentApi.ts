import { authService } from './auth';
import { throwIfResNotOk } from './queryClient';

async function authHeaders() {
  const headers: Record<string, string> = {};
  const token = await authService.getCurrentUserToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function uploadDocument(
  userType: 'candidate' | 'employer',
  docType: string,
  file: File,
  uid?: string
) {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append('file', file);
  const base = uid
    ? `/api/admin/${userType}s/${uid}/documents`
    : `/api/${userType}s/documents`;
  const res = await fetch(`${base}/${docType}`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  await throwIfResNotOk(res);
  return res.json();
}

export async function uploadCertificates(files: File[], uid?: string) {
  const headers = await authHeaders();
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const base = uid ? `/api/admin/candidates/${uid}/documents` : '/api/candidates/documents';
  const res = await fetch(`${base}/certificates`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  await throwIfResNotOk(res);
  return res.json();
}

export async function listDocuments(userType: 'candidate' | 'employer', uid?: string) {
  const headers = await authHeaders();
  const base = uid
    ? `/api/admin/${userType}s/${uid}/documents`
    : `/api/${userType}s/documents`;
  const res = await fetch(`${base}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  await throwIfResNotOk(res);
  return res.json();
}

export async function downloadDocument(
  userType: 'candidate' | 'employer',
  docType: string,
  filename: string,
  uid?: string
) {
  const headers = await authHeaders();
  const base = uid
    ? `/api/admin/${userType}s/${uid}/documents`
    : `/api/${userType}s/documents`;
  const url = `${base}/${docType}?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url, { headers, credentials: 'include' });
  await throwIfResNotOk(res);
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const name = match ? match[1] : filename;
  return { blob, name };
}
