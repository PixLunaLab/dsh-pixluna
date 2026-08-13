import { createHash } from 'node:crypto'
import { requestJson, withQuery } from '../http'
import type { ImageResult, ProviderName, PixLunaConfig } from '../types'
import { isProviderName } from './registry'

interface FetchArgs {
  tag?: string
  r18?: boolean
  signal: AbortSignal
}

const random = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const tags = (value?: string) =>
  value
    ?.split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean) ?? []

function ratingTag(config: PixLunaConfig, requested?: boolean, syntax = 'rating:safe') {
  return config.isR18 && requested ? '' : syntax
}

export async function fetchFromProvider(
  config: PixLunaConfig,
  provider: ProviderName,
  args: FetchArgs
): Promise<ImageResult> {
  switch (provider) {
    case 'lolicon':
    case 'lolisuki':
      return fetchLoliconLike(config, provider, args)
    case 'danbooru':
      return fetchDanbooru(config, args)
    case 'e621':
      return fetchE621(config, args)
    case 'gelbooru':
      return fetchGelbooru(config, args)
    case 'safebooru':
      return fetchSafebooru(config, args)
    case 'konachan':
    case 'yande':
    case 'lolibooru':
      return fetchMoebooru(config, provider, args)
    case 'pdiscovery':
      return fetchPixivDiscovery(config, args)
    case 'pfollowing':
      return fetchPixivFollowing(config, args)
    case 'sankaku':
      return fetchSankaku(config, args)
  }
}

export function resolveSources(config: PixLunaConfig, source?: string): ProviderName[] {
  if (source) {
    if (!isProviderName(source)) throw new Error(`未知图源：${source}`)
    return [source]
  }
  const valid = config.defaultSourceProvider.filter((item): item is ProviderName =>
    isProviderName(item)
  )
  if (!valid.length) throw new Error('未配置有效的默认图片来源')
  return valid
}

async function fetchLoliconLike(
  config: PixLunaConfig,
  provider: 'lolicon' | 'lolisuki',
  args: FetchArgs
): Promise<ImageResult> {
  const endpoint =
    provider === 'lolicon' ? 'https://api.lolicon.app/setu/v2' : 'https://lolisuki.cn/api/setu/v1'
  const response = await requestJson<{
    error: string
    data: Array<{
      pid: number
      title: string
      author: string
      r18: boolean
      tags: string[]
      urls: { original: string; regular?: string }
    }>
  }>(config, endpoint, {
    method: 'POST',
    body: {
      r18: config.isR18 && args.r18 ? 1 : 0,
      num: 1,
      tag: tags(args.tag),
      excludeAI: config.excludeAI,
      proxy: config.baseUrl || undefined,
      size: ['regular', 'original']
    },
    signal: args.signal
  })
  const image = response.data?.[0]
  if (response.error || !image) throw new Error(response.error || `${provider} 没有返回图片`)
  return {
    id: String(image.pid),
    title: image.title,
    author: image.author,
    r18: image.r18,
    tags: image.tags,
    source: provider,
    url: image.urls.regular ?? image.urls.original,
    originalUrl: image.urls.original
  }
}

async function fetchDanbooru(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  const key = config.danbooru.keyPairs.length ? random(config.danbooru.keyPairs) : undefined
  const posts = await requestJson<
    Array<{
      id: number
      file_url: string
      large_file_url: string
      tag_string: string
      tag_string_artist: string
      rating: string
    }>
  >(
    config,
    withQuery('https://danbooru.donmai.us/posts.json', {
      tags: `${tags(args.tag).join(' ')} ${config.isR18 && args.r18 ? 'rating:explicit' : 'rating:safe'}`.trim(),
      random: 'true',
      limit: 1,
      login: key?.login,
      api_key: key?.apiKey
    }),
    { signal: args.signal }
  )
  const post = posts[0]
  if (!post?.file_url) throw new Error('Danbooru 没有返回图片')
  return {
    id: String(post.id),
    title: `Danbooru ${post.id}`,
    author: post.tag_string_artist.replaceAll('_', ' '),
    r18: post.rating !== 's',
    tags: post.tag_string.split(' '),
    source: 'danbooru',
    url: post.large_file_url || post.file_url,
    originalUrl: post.file_url
  }
}

async function fetchE621(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  const key = config.e621.keyPairs.length ? random(config.e621.keyPairs) : undefined
  const headers = key
    ? { Authorization: `Basic ${Buffer.from(`${key.login}:${key.apiKey}`).toString('base64')}` }
    : undefined
  const response = await requestJson<{
    posts: Array<{
      id: number
      file: { url: string }
      sample: { url: string }
      tags: { general: string[]; artist: string[] }
      description: string
      rating: string
    }>
  }>(
    config,
    withQuery('https://e621.net/posts.json', {
      tags: `${tags(args.tag).join(' ')} order:random ${config.isR18 && args.r18 ? '-rating:s' : 'rating:s'}`.trim(),
      limit: 1
    }),
    { headers, signal: args.signal }
  )
  const post = response.posts[0]
  if (!post?.file.url) throw new Error('E621 没有返回图片')
  return {
    id: String(post.id),
    title: post.description || `E621 ${post.id}`,
    author: post.tags.artist.join(', '),
    r18: post.rating !== 's',
    tags: [...post.tags.general, ...post.tags.artist],
    source: 'e621',
    url: post.sample.url || post.file.url,
    originalUrl: post.file.url
  }
}

async function fetchGelbooru(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  const key = config.gelbooru.keyPairs.length ? random(config.gelbooru.keyPairs) : undefined
  const response = await requestJson<{
    post?: Array<{
      id: number
      file_url: string
      sample_url: string
      tags: string
      source: string
      owner: string
      rating: string
    }>
  }>(
    config,
    withQuery('https://gelbooru.com/index.php', {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: 1,
      limit: 1,
      tags: `${tags(args.tag).join(' ')} sort:random ${ratingTag(config, args.r18)}`.trim(),
      api_key: key?.apiKey,
      user_id: key?.userId
    }),
    { signal: args.signal }
  )
  const post = response.post?.[0]
  if (!post?.file_url) throw new Error('Gelbooru 没有返回图片')
  return {
    id: String(post.id),
    title: post.source || `Gelbooru ${post.id}`,
    author: post.owner.replaceAll('_', ' '),
    r18: post.rating !== 'safe' && post.rating !== 'general',
    tags: post.tags.split(' '),
    source: 'gelbooru',
    url: post.sample_url || post.file_url,
    originalUrl: post.file_url
  }
}

async function fetchSafebooru(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  const posts = await requestJson<
    Array<{
      id: number
      directory: string
      image: string
      tags: string
      owner: string
      rating: string
      sample: boolean
    }>
  >(
    config,
    withQuery('https://safebooru.org/index.php', {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: 1,
      limit: 1,
      tags: `${tags(args.tag).join(' ')} sort:random`.trim()
    }),
    { signal: args.signal }
  )
  const post = posts[0]
  if (!post) throw new Error('Safebooru 没有返回图片')
  const originalUrl = `https://safebooru.org/images/${post.directory}/${post.image}?${post.id}`
  const sampleUrl = post.sample
    ? `https://safebooru.org/samples/${post.directory}/sample_${post.image}?${post.id}`
    : originalUrl
  return {
    id: String(post.id),
    title: `Safebooru ${post.id}`,
    author: post.owner.replaceAll('_', ' '),
    r18: false,
    tags: post.tags.split(' '),
    source: 'safebooru',
    url: sampleUrl,
    originalUrl
  }
}

async function fetchMoebooru(
  config: PixLunaConfig,
  provider: 'konachan' | 'yande' | 'lolibooru',
  args: FetchArgs
): Promise<ImageResult> {
  const endpoint =
    provider === 'konachan'
      ? 'https://konachan.com/post.json'
      : provider === 'yande'
        ? 'https://yande.re/post.json'
        : 'https://lolibooru.moe/post/index.json'
  const key = config[provider].keyPairs.length ? random(config[provider].keyPairs) : undefined
  const salts = {
    konachan: (password: string) => `So-I-Heard-You-Like-Mupkids-?--${password}--`,
    yande: (password: string) => `choujin-steiner--${password}--`,
    lolibooru: (password: string) => `--${password}--`
  }
  const posts = await requestJson<
    Array<{
      id: number
      file_url: string
      sample_url: string
      tags: string
      author: string
      source: string
      rating: string
    }>
  >(
    config,
    withQuery(endpoint, {
      tags: `${tags(args.tag).join(' ')} order:random ${config.isR18 && args.r18 ? '-rating:s' : 'rating:s'}`.trim(),
      limit: 1,
      login: key?.login,
      password_hash: key
        ? createHash('sha1').update(salts[provider](key.password)).digest('hex')
        : undefined
    }),
    { signal: args.signal }
  )
  const post = posts[0]
  if (!post?.file_url) throw new Error(`${provider} 没有返回图片`)
  return {
    id: String(post.id),
    title: post.source || `${provider} ${post.id}`,
    author: post.author?.replaceAll('_', ' ') || '',
    r18: post.rating !== 's' && post.rating !== 'safe',
    tags: post.tags.split(' '),
    source: provider,
    url: post.sample_url || post.file_url,
    originalUrl: post.file_url
  }
}

interface PixivIllust {
  id: string
  title: string
  userName: string
  url?: string
  tags: string[] | Array<{ tag: string }>
  xRestrict: number
}

function pixivHeaders(config: PixLunaConfig) {
  if (!config.pixiv.phpSESSID) throw new Error('Pixiv 图源需要配置 pixiv.phpSESSID')
  return { Referer: 'https://www.pixiv.net/', Cookie: `PHPSESSID=${config.pixiv.phpSESSID}` }
}

function pixivUrl(config: PixLunaConfig, original: string) {
  return original.replace('i.pximg.net', config.baseUrl || 'i.pximg.net')
}

async function pixivDetail(
  config: PixLunaConfig,
  id: string,
  signal: AbortSignal
): Promise<ImageResult> {
  const response = await requestJson<{
    error: boolean
    message: string
    body: {
      id: string
      title: string
      userName: string
      xRestrict: number
      pageCount: number
      urls: { original: string }
      tags: { tags: Array<{ tag: string }> }
    }
  }>(config, `https://www.pixiv.net/ajax/illust/${id}`, {
    headers: pixivHeaders(config),
    signal
  })
  if (response.error) throw new Error(response.message || 'Pixiv 图片详情获取失败')
  const image = response.body
  return {
    id: image.id,
    title: image.title,
    author: image.userName,
    r18: image.xRestrict > 0,
    tags: image.tags.tags.map((item) => item.tag),
    source: 'pdiscovery',
    url: pixivUrl(config, image.urls.original),
    originalUrl: pixivUrl(config, image.urls.original),
    page: 0,
    pageCount: image.pageCount
  }
}

async function fetchPixivDiscovery(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  const response = await requestJson<{
    error: boolean
    message: string
    body: { illusts: PixivIllust[] }
  }>(
    config,
    withQuery('https://www.pixiv.net/ajax/illust/discovery', {
      mode: config.isR18 && args.r18 ? 'r18' : 'all',
      limit: 20
    }),
    { headers: pixivHeaders(config), signal: args.signal }
  )
  const wanted = tags(args.tag).map((tag) => tag.toLowerCase())
  const matches = response.body?.illusts.filter((illust) => {
    if (!config.isR18 && illust.xRestrict > 0) return false
    const haystack = [
      illust.title,
      ...illust.tags.map((tag) => (typeof tag === 'string' ? tag : tag.tag))
    ]
      .join(' ')
      .toLowerCase()
    return wanted.every((tag) => haystack.includes(tag))
  })
  const image = matches?.length
    ? random(matches)
    : response.body?.illusts.find((item) => config.isR18 || item.xRestrict === 0)
  if (response.error || !image) throw new Error(response.message || 'Pixiv Discovery 没有返回图片')
  return pixivDetail(config, image.id, args.signal)
}

async function fetchPixivFollowing(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  if (!config.pixiv.userId) throw new Error('Pixiv Following 图源需要配置 pixiv.userId')
  const headers = pixivHeaders(config)
  const following = await requestJson<{
    error: boolean
    message: string
    body: { users: Array<{ userId: string }> }
  }>(
    config,
    withQuery(
      `https://www.pixiv.net/ajax/user/${encodeURIComponent(config.pixiv.userId)}/following`,
      {
        offset: 0,
        limit: 100,
        rest: 'show'
      }
    ),
    { headers, signal: args.signal }
  )
  if (following.error || !following.body?.users.length) {
    throw new Error(following.message || 'Pixiv Following 未找到关注用户')
  }

  const wanted = tags(args.tag).map((tag) => tag.toLowerCase())
  const users = [...following.body.users].sort(() => Math.random() - 0.5).slice(0, 10)
  for (const user of users) {
    const profile = await requestJson<{
      error: boolean
      body: { illusts: Record<string, unknown> }
    }>(config, `https://www.pixiv.net/ajax/user/${encodeURIComponent(user.userId)}/profile/all`, {
      headers,
      signal: args.signal
    })
    if (profile.error || !profile.body?.illusts) continue
    const ids = Object.keys(profile.body.illusts)
    for (const id of ids.sort(() => Math.random() - 0.5).slice(0, wanted.length ? 20 : 1)) {
      const result = await pixivDetail(config, id, args.signal)
      if (!config.isR18 && result.r18) continue
      const haystack = `${result.title} ${result.tags.join(' ')}`.toLowerCase()
      if (wanted.every((tag) => haystack.includes(tag))) return { ...result, source: 'pfollowing' }
    }
  }
  throw new Error('Pixiv Following 没有找到符合条件的图片')
}

async function fetchSankaku(config: PixLunaConfig, args: FetchArgs): Promise<ImageResult> {
  const key = config.sankaku.keyPairs.length ? random(config.sankaku.keyPairs) : undefined
  if (!key) throw new Error('Sankaku 图源需要配置账号密码')
  if (!key.accessToken) {
    const token = await requestJson<{ access_token: string; token_type: string }>(
      config,
      'https://capi-v2.sankakucomplex.com/auth/token',
      { method: 'POST', body: { login: key.login, password: key.password }, signal: args.signal }
    )
    key.accessToken = token.access_token
    key.tokenType = token.token_type
  }
  const posts = await requestJson<
    Array<{
      id: number
      file_url: string
      sample_url: string
      tags: Array<{ name: string }>
      source: string
      author: { name: string }
      rating: string
    }>
  >(
    config,
    withQuery('https://capi-v2.sankakucomplex.com/posts/random', {
      tags: `${tags(args.tag).join(' ')} ${ratingTag(config, args.r18)}`.trim(),
      limit: 1
    }),
    {
      headers: { Authorization: `${key.tokenType ?? 'Bearer'} ${key.accessToken}` },
      signal: args.signal
    }
  )
  const post = posts[0]
  if (!post?.file_url) throw new Error('Sankaku 没有返回图片')
  return {
    id: String(post.id),
    title: post.source || `Sankaku ${post.id}`,
    author: post.author?.name || '',
    r18: post.rating !== 'safe',
    tags: post.tags.map((tag) => tag.name),
    source: 'sankaku',
    url: post.sample_url || post.file_url,
    originalUrl: post.file_url
  }
}
