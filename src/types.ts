export const providerNames = [
  'danbooru',
  'e621',
  'gelbooru',
  'konachan',
  'lolibooru',
  'lolicon',
  'lolisuki',
  'pdiscovery',
  'pfollowing',
  'safebooru',
  'sankaku',
  'yande'
] as const

export type ProviderName = (typeof providerNames)[number]

export interface ImageResult {
  id: string
  title: string
  author: string
  r18: boolean
  tags: string[]
  source: ProviderName
  url: string
  originalUrl: string
  page?: number
  pageCount?: number
}

export interface ProviderInfo {
  name: ProviderName
  description: string
  configured: boolean
}

export interface PixLunaConfig {
  isR18: boolean
  r18P: number
  excludeAI: boolean
  isProxy: boolean
  proxyHost: string
  baseUrl: string
  maxConcurrency: number
  defaultSourceProvider: ProviderName[]
  apiDelay: number
  showTags: boolean
  pixiv: { phpSESSID: string; userId: string }
  danbooru: { keyPairs: { login: string; apiKey: string }[] }
  e621: { keyPairs: { login: string; apiKey: string }[] }
  gelbooru: { keyPairs: { apiKey: string; userId?: string }[] }
  lolibooru: { keyPairs: { login: string; password: string }[] }
  sankaku: {
    keyPairs: { login: string; password: string; tokenType?: string; accessToken?: string }[]
  }
  konachan: { keyPairs: { login: string; password: string }[] }
  yande: { keyPairs: { login: string; password: string }[] }
}
