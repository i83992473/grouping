/** Resolved public env. Use for future fetch() to your API layer (not RDS directly). */
export function getApiBaseUrl(): string | undefined {
  const v = import.meta.env.VITE_API_BASE_URL
  if (typeof v !== 'string' || v.trim() === '') return undefined
  return v.replace(/\/$/, '')
}
