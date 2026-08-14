import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { Config, defaultConfig } from './config'
import { resolveCredentialConfig } from './credentials'
import { renderImages } from './format'
import { PixLunaConfigGateway } from './gateway'
import { requestJson } from './http'
import { fetchFromProvider, resolveSources } from './providers/fetch'
import { listProviders } from './providers/registry'
import type { ImageResult, PixLunaConfig, ProviderName } from './types'

export const name = 'pixluna'
export const inject = ['tools']
export const PIXLUNA_SETTINGS_NAMESPACE = settingsNamespace('pixluna')
export { Config }
export type { PixLunaConfigPatch, PixLunaEditableConfig } from './gateway'
export type { ImageResult, PixLunaConfig, ProviderInfo, ProviderName } from './types'

const imageSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', required: true },
    title: { type: 'string', required: true },
    author: { type: 'string', required: true },
    r18: { type: 'boolean', required: true },
    tags: { type: 'array', required: true, items: { type: 'string' } },
    source: {
      type: 'string',
      required: true,
      enum: [
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
      ]
    },
    url: { type: 'string', required: true },
    originalUrl: { type: 'string', required: true },
    page: { type: 'integer' },
    pageCount: { type: 'integer' }
  }
} as const

function sleep(milliseconds: number, signal: AbortSignal) {
  if (milliseconds <= 0) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener('abort', abort)
      resolve()
    }
    const timer = setTimeout(finish, milliseconds)
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(signal.reason ?? new Error('PixLuna 调用已取消'))
    }
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

function chooseSource(sources: ProviderName[]) {
  return sources[Math.floor(Math.random() * sources.length)]
}

async function getImages(
  config: PixLunaConfig,
  args: { number?: number; source?: string; tag?: string; r18?: boolean },
  signal: AbortSignal
) {
  const number = args.number ?? 1
  if (!Number.isInteger(number) || number < 1 || number > 10) {
    throw new Error('number 必须是 1 到 10 之间的整数')
  }
  if (args.r18 && !config.isR18) throw new Error('插件配置未启用 R18 内容')
  if (
    !Number.isInteger(config.maxConcurrency) ||
    config.maxConcurrency < 1 ||
    config.maxConcurrency > 10
  ) {
    throw new Error('maxConcurrency 必须是 1 到 10 之间的整数')
  }
  const sources = resolveSources(config, args.source)
  const images: ImageResult[] = []
  for (let index = 0; index < number; index += config.maxConcurrency) {
    if (index > 0) await sleep(config.apiDelay, signal)
    const batchSize = Math.min(config.maxConcurrency, number - index)
    const batch = Array.from({ length: batchSize }, () =>
      fetchFromProvider(config, chooseSource(sources), {
        tag: args.tag,
        r18: args.r18 ?? (config.isR18 && Math.random() < config.r18P),
        signal
      })
    )
    images.push(...(await Promise.all(batch)))
  }
  return { images }
}

export function apply(ctx: Context, config: PixLunaConfig = defaultConfig) {
  let current = () => config
  installSettingsSection(ctx, PIXLUNA_SETTINGS_NAMESPACE, Config, config, {
    setSource(source) {
      current = source
    },
    onChange() {}
  })
  new PixLunaConfigGateway(ctx, { source: () => current() })

  ctx.tools.register(
    defineTool({
      name: 'pixluna_get',
      description:
        '从 PixLuna 支持的图片来源获取一张或多张图片。原 command 的 number/source/tag 选项均作为工具参数。',
      parameters: {
        number: {
          type: 'integer',
          description: '图片数量，范围 1-10；默认 1。',
          default: 1
        },
        source: {
          type: 'string',
          description: '指定图源；省略时从插件配置的默认图源中随机选择。'
        },
        tag: {
          type: 'string',
          description: '图片标签；多个标签可用英文或中文逗号分隔。'
        },
        r18: {
          type: 'boolean',
          description: '是否请求 R18 内容；仅当插件配置 isR18=true 时允许。',
          default: false
        }
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            images: { type: 'array', required: true, items: imageSchema }
          }
        },
        render: (_args, value) => [
          { type: 'text', text: renderImages(value.images, current().showTags) }
        ]
      },
      timeoutMs: 30_000,
      execute: async (args, exec) =>
        getImages(await resolveCredentialConfig(ctx, current()), args, exec.signal),
      presentCall: (args) => ({
        card: 'generic',
        title: 'Get PixLuna images',
        kind: 'other',
        rawInput: args
      })
    })
  )

  ctx.tools.register(
    defineTool({
      name: 'pixluna_get_pixiv',
      description:
        '通过 Pixiv 作品 ID（pid）获取指定页或全部页面。原 pixluna.get.pixiv command 的 pid/pages/all 均作为工具参数。',
      parameters: {
        pid: { type: 'string', required: true, description: 'Pixiv 作品 ID。' },
        pages: { type: 'integer', description: '从 0 开始的页码；默认 0。', default: 0 },
        all: { type: 'boolean', description: '是否返回该作品的全部页面。', default: false }
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            images: { type: 'array', required: true, items: imageSchema }
          }
        },
        render: (_args, value) => [
          { type: 'text', text: renderImages(value.images, current().showTags) }
        ]
      },
      timeoutMs: 30_000,
      async execute(args, exec) {
        const config = await resolveCredentialConfig(ctx, current())
        const page = args.pages ?? 0
        if (!Number.isInteger(page) || page < 0) throw new Error('pages 必须是大于等于 0 的整数')
        const headers = {
          Referer: 'https://www.pixiv.net/',
          Cookie: `PHPSESSID=${config.pixiv.phpSESSID}`
        }
        if (!config.pixiv.phpSESSID) throw new Error('Pixiv 工具需要配置 pixiv.phpSESSID')
        const result = await requestJson<{
          error: boolean
          message: string
          body: Array<{ urls: { original: string } }>
        }>(config, `https://www.pixiv.net/ajax/illust/${encodeURIComponent(args.pid)}/pages`, {
          headers,
          signal: exec.signal
        })
        if (result.error || !result.body?.length)
          throw new Error(result.message || 'Pixiv 没有返回图片页面')
        if (!args.all && page >= result.body.length)
          throw new Error(`pages 超出范围，该作品共 ${result.body.length} 页`)
        const selected = args.all
          ? result.body.map((item, index) => [item, index] as const)
          : [[result.body[page], page] as const]
        const images: ImageResult[] = selected.map(([item, index]) => {
          const url = item.urls.original.replace('i.pximg.net', config.baseUrl || 'i.pximg.net')
          return {
            id: args.pid,
            title: `Pixiv ${args.pid}`,
            author: '',
            r18: false,
            tags: [],
            source: 'pdiscovery',
            url,
            originalUrl: url,
            page: index,
            pageCount: result.body.length
          }
        })
        return { images }
      },
      presentCall: (args) => ({
        card: 'generic',
        title: `Get Pixiv ${args.pid}`,
        kind: 'other',
        rawInput: args
      })
    })
  )

  ctx.tools.register(
    defineTool({
      name: 'pixluna_sources',
      description: '列出 PixLuna 支持的图片来源，以及当前配置是否具备该图源所需凭据。',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            providers: {
              type: 'array',
              required: true,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string', required: true },
                  description: { type: 'string', required: true },
                  configured: { type: 'boolean', required: true }
                }
              }
            }
          }
        },
        render: (_args, value) => [
          {
            type: 'text',
            text: value.providers
              .map(
                (provider) =>
                  `- ${provider.name}: ${provider.description}（${provider.configured ? '已配置' : '未配置凭据'}）`
              )
              .join('\n')
          }
        ]
      },
      async execute() {
        return { providers: listProviders(await resolveCredentialConfig(ctx, current())) }
      },
      isConcurrencySafe: () => true,
      presentCall: () => ({ card: 'generic', title: 'List PixLuna sources', kind: 'search' })
    })
  )
}
