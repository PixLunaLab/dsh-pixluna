import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace, type SettingsProvider } from '@deepseek-ai/dsh-settings'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { Config } from './config'
import type { PixLunaConfig, ProviderName } from './types'

export const PIXLUNA_CONFIG_SERVICE = 'pixlunaConfig'
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

/**
 * Host-side settings bridge for external clients. PixLuna is not part of the
 * API proxy's fixed settings namespace allowlist, so the browser reaches this
 * service through Typert Gateway instead of settings.describe/settings.mutate.
 */
export class PixLunaConfigGateway extends TypertRemoteService {
  private settings: SettingsProvider | undefined

  constructor(
    ctx: Context,
    private readonly bridge: PixLunaSettingsBridge
  ) {
    super(ctx, PIXLUNA_CONFIG_SERVICE)
    markGatewayRemotes(this)
    ctx.inject(['settings'], (sctx) => {
      this.settings = sctx.settings
      return () => {
        this.settings = undefined
      }
    })
  }

  get(): { config: PixLunaEditableConfig; writable: boolean } {
    return {
      config: editable(this.bridge.source()),
      writable: this.settings?.writable === true
    }
  }

  async set(
    patch: PixLunaConfigPatch
  ): Promise<{ config: PixLunaEditableConfig; writable: boolean }> {
    validatePatch(this.bridge.source(), patch)
    if (Object.keys(patch).length > 0) {
      const settings = this.settings
      if (settings === undefined) {
        throw new Error('pixluna: settings service is unavailable — configuration cannot be written')
      }
      await settings.update(PIXLUNA_NS, patch)
    }
    return this.get()
  }
}

function markGatewayRemotes(instance: PixLunaConfigGateway): void {
  for (const method of ['get', 'set'] as const) {
    const implementation = PixLunaConfigGateway.prototype[method] as (
      this: PixLunaConfigGateway,
      ...args: any[]
    ) => unknown
    Remote(method)(implementation, {
      kind: 'method',
      name: method,
      static: false,
      private: false,
      access: {
        has: (value: object) => method in value,
        get: (value: PixLunaConfigGateway) => value[method]
      },
      addInitializer(initializer) {
        initializer.call(instance)
      }
    } as ClassMethodDecoratorContext<PixLunaConfigGateway, typeof implementation>)
  }
}
