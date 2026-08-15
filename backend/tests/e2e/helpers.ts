export function cookiesFrom(res: Response): Record<string, string> {
  const headers = res.headers as unknown as { getSetCookie?: () => string[] }
  const raw = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter((x): x is string => !!x)
  const out: Record<string, string> = {}
  for (const line of raw) {
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const name = line.slice(0, eq)
    const value = line.slice(eq + 1).split(';')[0]
    out[name] = value
  }
  return out
}

export function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}