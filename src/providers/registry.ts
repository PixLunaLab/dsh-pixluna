import type { ProviderInfo, ProviderName, PixLunaConfig } from '../types'

const descriptions: Record<ProviderName, string> = {
  danbooru: '通过 Danbooru API 获取图片',
  e621: '通过 E621 API 获取图片',
  gelbooru: '通过 Gelbooru API 获取图片',
  konachan: '通过 Konachan API 获取图片',
  lolibooru: '通过 Lolibooru API 获取图片',
  lolicon: '通过 Lolicon API 获取图片',
  lolisuki: '通过 Lolisuki API 获取图片',
  pdiscovery: '通过 Pixiv Discovery 获取图片',
  pfollowing: '通过 Pixiv 关注列表获取图片',
  safebooru: '通过 Safebooru API 获取图片',
  sankaku: '通过 Sankaku Complex API 获取图片',
  yande: '通过 Yande.re API 获取图片'
}

const names = Object.keys(descriptions) as ProviderName[]

function configured(config: PixLunaConfig, name: ProviderName) {
  if (name === 'pdiscovery' || name === 'pfollowing') return Boolean(config.pixiv.phpSESSID)
  if (name === 'sankaku') return config.sankaku.keyPairs.length > 0
  if (
    name === 'danbooru' ||
    name === 'e621' ||
    name === 'gelbooru' ||
    name === 'lolibooru' ||
    name === 'konachan' ||
    name === 'yande'
  ) {
    return config[name].keyPairs.length > 0
  }
  return true
}

export function listProviders(config: PixLunaConfig): ProviderInfo[] {
  return names.map((name) => ({
    name,
    description: descriptions[name],
    configured: configured(config, name)
  }))
}

export function isProviderName(value: string): value is ProviderName {
  return Object.hasOwn(descriptions, value)
}
