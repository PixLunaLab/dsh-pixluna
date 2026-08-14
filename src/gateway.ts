import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace, type SettingsProvider } from '@deepseek-ai/dsh-settings'
import { Config } from './config'
import type { PixLunaConfig, ProviderName } from './types'

const PIXLUNA_NS = settingsNamespace('pixluna')

export interface PixLunaEditableConfig {
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
  pixiv: { userId: string }
}

export type PixLunaConfigPatch = Partial<Omit<PixLunaEditableConfig, 'pixiv'>> & {
  pixiv?: { userId?: string }
}

export interface PixLunaSettingsBridge {
  source(): PixLunaConfig
}

const editableKeys = new Set([
  'isR18',
  'r18P',
  'excludeAI',
  'isProxy',
  'proxyHost',
  'baseUrl',
  'maxConcurrency',
  'defaultSourceProvider',
  'apiDelay',
  'showTags',
  'pixiv'
])

function editable(config: PixLunaConfig): PixLunaEditableConfig {
  return {
    isR18: config.isR18,
    r18P: config.r18P,
    excludeAI: config.excludeAI,
    isProxy: config.isProxy,
    proxyHost: config.proxyHost,
    baseUrl: config.baseUrl,
    maxConcurrency: config.maxConcurrency,
    defaultSourceProvider: [...config.defaultSourceProvider],
    apiDelay: config.apiDelay,
    showTags: config.showTags,
    pixiv: { userId: config.pixiv.userId }
  }
}

function validatePatch(current: PixLunaConfig, patch: PixLunaConfigPatch): void {
  for (const key of Object.keys(patch)) {
    if (!editableKeys.has(key)) throw new Error(`pixluna: configuration field ${key} is not editable`)
  }
  if (
    patch.pixiv !== undefined &&
    Object.keys(patch.pixiv).some((key) => key !== 'userId')
  ) {
    throw new Error('pixluna: only pixiv.userId is editable through the settings gateway')
  }
  Config({
    ...current,
    ...patch,
    pixiv: { ...current.pixiv, ...patch.pixiv }
  })
}

interface WebServer {
  register(route: {
    kind: 'prefix'
    path: string
    handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
  }): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer: WebServer
  }
}

export function registerPixLunaConfigGateway(
  ctx: Context,
  bridge: PixLunaSettingsBridge
): void {
  let settings: SettingsProvider | undefined
  ctx.inject(['settings'], (sctx) => {
    settings = sctx.settings
    return () => {
      settings = undefined
    }
  })
  ctx.inject(['webServer'], (sctx) =>
    sctx.effect(
      () =>
        sctx.webServer.register({
          kind: 'prefix',
          path: '/pixluna/api',
          handler: (request, response) => handleRequest(request, response, bridge, settings)
        }),
      'pixluna: settings API'
    )
  )
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  bridge: PixLunaSettingsBridge,
  settings: SettingsProvider | undefined
): Promise<void> {
  if (request.method !== 'POST')
    return writeJson(response, 405, failure('method-not-allowed', 'POST only'))
  const contentType = request.headers['content-type']
  if (
    typeof contentType !== 'string' ||
    !contentType.toLowerCase().startsWith('application/json')
  ) {
    return writeJson(response, 415, failure('unsupported-media-type', 'application/json required'))
  }
  const host = request.headers.host
  const origin = request.headers.origin
  const fetchSite = request.headers['sec-fetch-site']
  if (
    host === undefined ||
    !isLoopbackHost(host) ||
    fetchSite === 'cross-site' ||
    (origin !== undefined && new URL(origin).host !== host)
  ) {
    return writeJson(
      response,
      403,
      failure('forbidden-origin', 'trusted same-origin request required')
    )
  }
  const pathname = new URL(request.url ?? '/', 'http://dsh.internal').pathname
  const method = pathname.startsWith('/pixluna/api/')
    ? pathname.slice('/pixluna/api/'.length)
    : ''
  try {
    if (method === 'get') {
      writeJson(
        response,
        200,
        success({ config: editable(bridge.source()), writable: settings?.writable === true })
      )
      return
    }
    if (method === 'set') {
      const body = await readJson(request)
      const patch = body.patch
      if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
        throw new Error('pixluna: set requires a plain-object patch')
      }
      validatePatch(bridge.source(), patch as PixLunaConfigPatch)
      if (Object.keys(patch).length > 0) {
        if (settings === undefined) throw new Error('pixluna: settings service is unavailable')
        await settings.update(PIXLUNA_NS, patch as PixLunaConfigPatch)
      }
      writeJson(
        response,
        200,
        success({ config: editable(bridge.source()), writable: settings?.writable === true })
      )
      return
    }
    writeJson(response, 404, failure('not-found', 'unknown PixLuna settings method'))
  } catch (error) {
    writeJson(
      response,
      400,
      failure('invalid-request', error instanceof Error ? error.message : String(error))
    )
  }
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 64 * 1024) throw new Error('pixluna: settings request is too large')
    chunks.push(buffer)
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as unknown
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('pixluna: settings request must be a JSON object')
  }
  return value as Record<string, unknown>
}

function isLoopbackHost(authority: string): boolean {
  try {
    const hostname = new URL(`http://${authority}`).hostname
    if (hostname === 'localhost' || hostname === '[::1]') return true
    const parts = hostname.split('.')
    return (
      parts.length === 4 &&
      parts[0] === '127' &&
      parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
    )
  } catch {
    return false
  }
}

function success(value: unknown): { ok: true; value: unknown } {
  return { ok: true, value }
}

function failure(
  code: string,
  message: string
): { ok: false; error: { code: string; message: string } } {
  return { ok: false, error: { code, message } }
}

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}
