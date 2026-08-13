import z from '@deepseek-ai/schemastery'
import { providerNames, type PixLunaConfig } from './types'

const keyPair = (properties: Record<string, z>) => z.object(properties)
const provider = z.union(providerNames.map((name) => z.const(name)))

export const Config: z<PixLunaConfig> = z.object({
  isR18: z.boolean().default(false).description('是否允许返回 R18 内容'),
  r18P: z.percent().default(0.1).min(0).max(1).description('R18 内容出现概率'),
  excludeAI: z.boolean().default(false).description('是否排除 AI 生成作品'),
  isProxy: z.boolean().default(false).description('是否使用代理'),
  proxyHost: z.string().default('http://127.0.0.1:7890').description('代理服务器地址'),
  baseUrl: z.string().default('i.pixiv.re').description('Pixiv 图片反代域名'),
  maxConcurrency: z.number().default(1).min(1).max(10).step(1).description('最大并发请求数'),
  defaultSourceProvider: z.array(provider).default(['lolicon']).description('默认图片来源'),
  apiDelay: z.number().default(1600).min(0).max(10000).step(1).description('请求间隔（毫秒）'),
  showTags: z.boolean().default(true).description('是否在结果中显示标签'),
  pixiv: z
    .object({
      phpSESSID: z.string().default('').role('secret'),
      userId: z.string().default('')
    })
    .default({ phpSESSID: '', userId: '' }),
  danbooru: z
    .object({
      keyPairs: z
        .array(keyPair({ login: z.string(), apiKey: z.string().role('secret') }))
        .default([])
    })
    .default({ keyPairs: [] }),
  e621: z
    .object({
      keyPairs: z
        .array(keyPair({ login: z.string(), apiKey: z.string().role('secret') }))
        .default([])
    })
    .default({ keyPairs: [] }),
  gelbooru: z
    .object({
      keyPairs: z
        .array(keyPair({ apiKey: z.string().role('secret'), userId: z.string().default('') }))
        .default([])
    })
    .default({ keyPairs: [] }),
  lolibooru: z
    .object({
      keyPairs: z
        .array(keyPair({ login: z.string(), password: z.string().role('secret') }))
        .default([])
    })
    .default({ keyPairs: [] }),
  sankaku: z
    .object({
      keyPairs: z
        .array(
          keyPair({
            login: z.string(),
            password: z.string().role('secret'),
            tokenType: z.string().default('Bearer'),
            accessToken: z.string().default('').role('secret')
          })
        )
        .default([])
    })
    .default({ keyPairs: [] }),
  konachan: z
    .object({
      keyPairs: z
        .array(keyPair({ login: z.string(), password: z.string().role('secret') }))
        .default([])
    })
    .default({ keyPairs: [] }),
  yande: z
    .object({
      keyPairs: z
        .array(keyPair({ login: z.string(), password: z.string().role('secret') }))
        .default([])
    })
    .default({ keyPairs: [] })
}) as z<PixLunaConfig>

export const defaultConfig: PixLunaConfig = {
  isR18: false,
  r18P: 0.1,
  excludeAI: false,
  isProxy: false,
  proxyHost: 'http://127.0.0.1:7890',
  baseUrl: 'i.pixiv.re',
  maxConcurrency: 1,
  defaultSourceProvider: ['lolicon'],
  apiDelay: 1600,
  showTags: true,
  pixiv: { phpSESSID: '', userId: '' },
  danbooru: { keyPairs: [] },
  e621: { keyPairs: [] },
  gelbooru: { keyPairs: [] },
  lolibooru: { keyPairs: [] },
  sankaku: { keyPairs: [] },
  konachan: { keyPairs: [] },
  yande: { keyPairs: [] }
}
