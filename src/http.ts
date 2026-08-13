import { ProxyAgent, fetch } from 'undici'
import type { PixLunaConfig } from './types'

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 PixLuna/DSH'

export interface RequestOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: unknown
  signal: AbortSignal
}

export async function requestJson<T>(
  config: PixLunaConfig,
  url: string,
  options: RequestOptions
): Promise<T> {
  const dispatcher = config.isProxy ? new ProxyAgent(config.proxyHost) : undefined
  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      dispatcher
    })
    if (!response.ok) {
      const details = (await response.text()).slice(0, 500)
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${details}`)
    }
    return (await response.json()) as T
  } finally {
    await dispatcher?.close()
  }
}

export function withQuery(base: string, params: Record<string, string | number | undefined>) {
  const url = new URL(base)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}
