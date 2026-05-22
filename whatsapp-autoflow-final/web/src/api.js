export function getToken() { return localStorage.getItem('token') }
export function setToken(t) { localStorage.setItem('token', t) }
export function clearToken() { localStorage.removeItem('token') }

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `HTTP_${res.status}`)
  }
  return res.json()
}
