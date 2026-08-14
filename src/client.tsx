type ClientRequire = (id: string) => any
type FieldKind = 'boolean' | 'number' | 'integer' | 'text' | 'providers'
type FieldSpec = readonly [path: string, kind: FieldKind]
type CredentialSpec = readonly [ref: string, key: string, multiline?: boolean]
type DraftValue = string | boolean
type Draft = Record<string, DraftValue>
type UnknownRecord = Record<string, any>

interface ClientModuleWindow extends Window {
  __ModuleLoader__: {
    load(module: {
      id: string
      factory: (require: ClientRequire) => { inject: string[]; apply(ctx: any): void }
    }): void
  }
}

;(window as unknown as ClientModuleWindow).__ModuleLoader__.load({
  id: 'dsh-pixluna',
  factory: (require: ClientRequire) => {
    const React = require('react')
    const {
      Button,
      IconCheckOutline16,
      IconChevronDownOutline14
    } = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'pixluna.settings'

    const zh = {
      title: 'PixLuna',
      description: '配置图片来源、请求行为和 Pixiv 访问凭据。',
      expand: '展开设置',
      collapse: '收起设置',
      loading: '正在加载设置…',
      retry: '重试',
      save: '保存',
      saving: '保存中…',
      discard: '放弃修改',
      unavailable: 'PixLuna 设置命名空间尚未注册。',
      readOnly: '本部署的设置为只读。',
      saveFailed: '设置保存失败，请检查字段后重试。',
      invalid: '请输入有效值。',
      isR18: '允许 R18 内容',
      isR18Hint: '允许工具显式或按概率请求 R18 图片。',
      r18P: 'R18 随机概率',
      r18PHint: '范围 0–1，仅在允许 R18 时生效。',
      excludeAI: '排除 AI 作品',
      excludeAIHint: '向支持此选项的图源请求排除 AI 生成作品。',
      isProxy: '启用代理',
      isProxyHint: '通过下方代理服务器发起图片 API 请求。',
      proxyHost: '代理服务器',
      proxyHostHint: '例如 http://127.0.0.1:7890。',
      baseUrl: 'Pixiv 图片反代域名',
      baseUrlHint: '默认 i.pixiv.re。',
      maxConcurrency: '最大并发请求数',
      maxConcurrencyHint: '整数，范围 1–10。',
      defaultSourceProvider: '默认图片来源',
      defaultSourceProviderHint: '逗号分隔，例如 lolicon, safebooru。',
      apiDelay: '请求批次间隔（毫秒）',
      apiDelayHint: '整数，范围 0–10000。',
      showTags: '在结果中显示标签',
      showTagsHint: '控制工具结果文本是否附带图片标签。',
      pixivUserId: 'Pixiv 用户 ID',
      pixivUserIdHint: '用于 Pixiv Following 图源。',
      credentialsTitle: '凭据配置',
      credentialsHint:
        '凭据由 DSH 凭据服务保存；读取时仅返回是否已配置，不会把原值发回浏览器。Key Pairs 使用 JSON 数组。',
      configured: '已配置',
      missing: '未配置',
      credentialReadOnly: '当前凭据来源只读，无法在此覆盖。',
      clearCredential: '清除凭据',
      pixivPhpSessId: 'Pixiv PHPSESSID',
      pixivPhpSessIdHint: '用于 Pixiv Discovery、Following 和按 PID 获取。',
      danbooruKeyPairs: 'Danbooru Key Pairs',
      e621KeyPairs: 'E621 Key Pairs',
      gelbooruKeyPairs: 'Gelbooru Key Pairs',
      lolibooruKeyPairs: 'Lolibooru Key Pairs',
      sankakuKeyPairs: 'Sankaku Key Pairs',
      konachanKeyPairs: 'Konachan Key Pairs',
      yandeKeyPairs: 'Yande Key Pairs',
      keyPairsHint: '输入完整 JSON 数组；留空不修改，输入 [] 可保存空数组。'
    }

    const en = {
      title: 'PixLuna',
      description: 'Configure image sources, request behavior, and Pixiv credentials.',
      expand: 'Show settings',
      collapse: 'Hide settings',
      loading: 'Loading settings…',
      retry: 'Retry',
      save: 'Save',
      saving: 'Saving…',
      discard: 'Discard',
      unavailable: 'The PixLuna settings namespace is not registered.',
      readOnly: 'This deployment stores settings read-only.',
      saveFailed: 'The settings could not be saved. Check the fields and retry.',
      invalid: 'Enter a valid value.',
      isR18: 'Allow R18 content',
      isR18Hint: 'Allow explicit or probabilistic R18 image requests.',
      r18P: 'Random R18 probability',
      r18PHint: 'A value from 0 to 1.',
      excludeAI: 'Exclude AI works',
      excludeAIHint: 'Request AI-generated works to be excluded where supported.',
      isProxy: 'Enable proxy',
      isProxyHint: 'Send image API requests through the proxy below.',
      proxyHost: 'Proxy server',
      proxyHostHint: 'For example http://127.0.0.1:7890.',
      baseUrl: 'Pixiv image proxy host',
      baseUrlHint: 'Defaults to i.pixiv.re.',
      maxConcurrency: 'Maximum concurrency',
      maxConcurrencyHint: 'An integer from 1 to 10.',
      defaultSourceProvider: 'Default image sources',
      defaultSourceProviderHint: 'Comma-separated, for example lolicon, safebooru.',
      apiDelay: 'Batch delay (ms)',
      apiDelayHint: 'An integer from 0 to 10000.',
      showTags: 'Show tags in results',
      showTagsHint: 'Include image tags in rendered tool results.',
      pixivUserId: 'Pixiv user ID',
      pixivUserIdHint: 'Used by the Pixiv Following source.',
      credentialsTitle: 'Credentials',
      credentialsHint:
        'Credentials are stored by DSH. Reads expose status only, never values. Key pairs use JSON arrays.',
      configured: 'Configured',
      missing: 'Not configured',
      credentialReadOnly:
        'The active credential source is read-only and cannot be overridden here.',
      clearCredential: 'Clear credential',
      pixivPhpSessId: 'Pixiv PHPSESSID',
      pixivPhpSessIdHint: 'Used for Pixiv Discovery, Following, and PID lookup.',
      danbooruKeyPairs: 'Danbooru key pairs',
      e621KeyPairs: 'E621 key pairs',
      gelbooruKeyPairs: 'Gelbooru key pairs',
      lolibooruKeyPairs: 'Lolibooru key pairs',
      sankakuKeyPairs: 'Sankaku key pairs',
      konachanKeyPairs: 'Konachan key pairs',
      yandeKeyPairs: 'Yande key pairs',
      keyPairsHint:
        'Enter the complete JSON array; blank leaves it unchanged, and [] stores an empty array.'
    }

    const credentialSpecs: CredentialSpec[] = [
      ['PIXLUNA_PIXIV_PHPSESSID', 'pixivPhpSessId'],
      ['PIXLUNA_DANBOORU_KEY_PAIRS', 'danbooruKeyPairs', true],
      ['PIXLUNA_E621_KEY_PAIRS', 'e621KeyPairs', true],
      ['PIXLUNA_GELBOORU_KEY_PAIRS', 'gelbooruKeyPairs', true],
      ['PIXLUNA_LOLIBOORU_KEY_PAIRS', 'lolibooruKeyPairs', true],
      ['PIXLUNA_SANKAKU_KEY_PAIRS', 'sankakuKeyPairs', true],
      ['PIXLUNA_KONACHAN_KEY_PAIRS', 'konachanKeyPairs', true],
      ['PIXLUNA_YANDE_KEY_PAIRS', 'yandeKeyPairs', true]
    ]

    const providers = new Set([
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
    ])
    const specs: FieldSpec[] = [
      ['isR18', 'boolean'],
      ['r18P', 'number'],
      ['excludeAI', 'boolean'],
      ['isProxy', 'boolean'],
      ['proxyHost', 'text'],
      ['baseUrl', 'text'],
      ['maxConcurrency', 'integer'],
      ['defaultSourceProvider', 'providers'],
      ['apiDelay', 'integer'],
      ['showTags', 'boolean'],
      ['pixiv.userId', 'text']
    ]
    const get = (value: unknown, path: string): unknown =>
      path.split('.').reduce<unknown>((out, key) =>
        out && typeof out === 'object' ? (out as UnknownRecord)[key] : undefined, value)
    const labelKey = (path: string) => (path === 'pixiv.userId' ? 'pixivUserId' : path)
    const format = (value: unknown, kind: FieldKind): DraftValue => {
      if (kind === 'providers') return Array.isArray(value) ? value.join(', ') : ''
      if (kind === 'boolean') return Boolean(value)
      return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
    }
    const parse = (value: DraftValue, kind: FieldKind): unknown => {
      if (kind === 'boolean') return value
      if (typeof value !== 'string') return undefined
      if (kind === 'text') return value
      if (kind === 'providers') {
        const list = value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
        return list.length && list.every((item) => providers.has(item)) ? list : undefined
      }
      if (value.trim() === '') return undefined
      const number = Number(value)
      if (!Number.isFinite(number) || (kind === 'integer' && !Number.isInteger(number)))
        return undefined
      return number
    }
    const valid = (path: string, kind: FieldKind, value: DraftValue) => {
      const parsed = parse(value, kind)
      if (parsed === undefined) return false
      if (path === 'r18P') return typeof parsed === 'number' && parsed >= 0 && parsed <= 1
      if (path === 'maxConcurrency')
        return typeof parsed === 'number' && parsed >= 1 && parsed <= 10
      if (path === 'apiDelay') return typeof parsed === 'number' && parsed >= 0 && parsed <= 10000
      return true
    }

    function ConfigController() {
      let snapshot: any = { status: 'loading', value: {}, writable: false }
      const listeners = new Set<() => void>()
      const publish = (next: any) => {
        snapshot = next
        for (const listener of listeners) listener()
      }
      const request = async (method: 'get' | 'set', body: unknown) => {
        const response = await fetch(`/pixluna/api/${method}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        })
        const result = await response.json()
        if (!response.ok || !result.ok) throw new Error(result.error?.message)
        return result.value
      }
      const load = async () => {
        publish({ ...snapshot, status: 'loading' })
        try {
          const value = await request('get', {})
          publish({
            status: 'ready',
            value: value.config,
            writable: value.writable === true
          })
        } catch {
          publish({ ...snapshot, status: 'unavailable', writable: false })
        }
      }
      const save = async (patch: UnknownRecord) => {
        const value = await request('set', { patch })
        publish({
          status: 'ready',
          value: value.config,
          writable: value.writable === true
        })
      }
      void load()
      return {
        getSnapshot: () => snapshot,
        subscribe(listener: () => void) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        load,
        save
      }
    }

    function Card({ t, scope, api }: { t: (key: string) => string; scope: any; api: any }) {
      const snapshot = React.useSyncExternalStore(scope.subscribe, scope.getSnapshot, scope.getSnapshot)
      const [open, setOpen] = React.useState(false)
      const [draft, setDraft] = React.useState({}) as [Draft, (value: any) => void]
      const [saving, setSaving] = React.useState(false)
      const [failed, setFailed] = React.useState(false)
      const [credentialDraft, setCredentialDraft] = React.useState({}) as [Record<string, string>, (value: any) => void]
      const [credentialViews, setCredentialViews] = React.useState({}) as [Record<string, { configured: boolean; writable: boolean; source?: string }>, (value: any) => void]
      const refreshCredentials = async () => {
        const response = await api.credentials.describe({ refs: credentialSpecs.map(([ref]) => ref) })
        if (!response.result.ok) throw new Error(response.result.error.message)
        setCredentialViews(response.result.value.credentials)
      }
      React.useEffect(() => {
        let active = true
        api.credentials.describe({ refs: credentialSpecs.map(([ref]) => ref) }).then((response: any) => {
          if (active && response.result.ok) setCredentialViews(response.result.value.credentials)
        })
        return () => { active = false }
      }, [api])
      const configDirty = Object.keys(draft).length > 0
      const credentialDirty = Object.values(credentialDraft).some(Boolean)
      const dirty = configDirty || credentialDirty
      const canSaveConfig = configDirty && snapshot.writable
      const canSaveCredentials = credentialSpecs.some(([ref]) => Boolean(credentialDraft[ref]) && credentialViews[ref]?.writable === true)
      const fieldValue = (path: string, kind: FieldKind): DraftValue => Object.hasOwn(draft, path) ? draft[path] : format(get(snapshot.value, path), kind)
      const invalidSettings = specs.some(([path, kind]) => Object.hasOwn(draft, path) && !valid(path, kind, draft[path]))
      const invalidCredentials = credentialSpecs.some(([ref, _key, multiline]) => {
        const value = credentialDraft[ref]
        if (!multiline || !value || credentialViews[ref]?.writable !== true) return false
        try { return !Array.isArray(JSON.parse(value)) } catch { return true }
      })
      const invalid = (canSaveConfig && invalidSettings) || (canSaveCredentials && invalidCredentials)
      const inputStyle = (bad: boolean) => ({ boxSizing: 'border-box' as const, width: '100%', minHeight: 34, border: '1px solid ' + (bad ? 'var(--dsw-alias-label-error)' : 'var(--dsw-alias-border-l2)'), borderRadius: 8, background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 13, lineHeight: 1.5, padding: '7px 12px' })
      const edit = (path: string, value: DraftValue) => { setFailed(false); setDraft((old: Draft) => ({ ...old, [path]: value })) }
      const editCredential = (ref: string, value: string) => { setFailed(false); setCredentialDraft((old: Record<string, string>) => ({ ...old, [ref]: value })) }
      const save = async () => {
        if ((!canSaveConfig && !canSaveCredentials) || invalid) return
        setSaving(true); setFailed(false)
        try {
          if (canSaveConfig) {
            const patch: UnknownRecord = {}
            for (const [path, kind] of specs) {
              if (!Object.hasOwn(draft, path)) continue
              const keys = path.split('.'); let target = patch
              for (const key of keys.slice(0, -1)) target = (target[key] ??= {}) as UnknownRecord
              target[keys[keys.length - 1]] = parse(draft[path], kind)
            }
            await scope.save(patch)
          }
          if (canSaveCredentials) {
            for (const [ref] of credentialSpecs) {
              const value = credentialDraft[ref]
              if (!value || credentialViews[ref]?.writable !== true) continue
              const stored = await api.credentials.set({ ref, value })
              if (!stored.result.ok) throw new Error(stored.result.error.message)
            }
            await refreshCredentials()
          }
          if (canSaveConfig) setDraft({}); if (canSaveCredentials) setCredentialDraft({})
        } catch { setFailed(true) } finally { setSaving(false) }
      }
      const clearCredential = async (ref: string) => {
        setFailed(false)
        try { const removed = await api.credentials.unset({ ref }); if (!removed.result.ok) throw new Error(removed.result.error.message); await refreshCredentials() } catch { setFailed(true) }
      }
      const booleanControl = (path: string, value: DraftValue, title: string) => (
        <button type="button" role="checkbox" aria-checked={Boolean(value)} aria-label={title} disabled={!snapshot.writable} onClick={() => edit(path, !value)} style={{ appearance: 'none', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 5, background: value ? 'var(--dsw-alias-button-primary-fill)' : 'transparent', color: 'var(--dsw-alias-label-primary-foreground)', cursor: snapshot.writable ? 'pointer' : 'default', opacity: snapshot.writable ? 1 : 0.4 }}>{value ? <IconCheckOutline16 size={14} /> : null}</button>
      )
      return (
        <li style={{ listStyle: 'none', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: open ? 'var(--dsw-alias-bg-layer-2)' : 'var(--dsw-alias-bg-layer-3)' }}>
          <button type="button" aria-expanded={open} aria-label={t(open ? 'collapse' : 'expand') + ': ' + t('title')} onClick={() => setOpen(!open)} style={{ width: '100%', appearance: 'none', border: 0, background: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12 }}><span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{t('title')}</span><span style={{ fontSize: 13, color: 'var(--dsw-alias-label-tertiary)' }}>{t('description')}</span></span>{dirty ? <span aria-label={t('save')}>●</span> : null}<span style={{ transform: open ? 'rotate(180deg)' : 'none' }}><IconChevronDownOutline14 /></span></button>
          {open ? <div style={{ borderTop: '1px solid var(--dsw-alias-border-l2)', margin: '0 16px', paddingBottom: 8 }}>
            {snapshot.status === 'loading' ? <p>{t('loading')}</p> : null}
            {snapshot.status === 'unavailable' ? <div><p>{t('unavailable')}</p><Button variant="outline" onClick={scope.load}>{t('retry')}</Button></div> : null}
            {snapshot.status === 'ready' ? specs.map(([path, kind], index) => { const key = labelKey(path); const title = t(key); const value = fieldValue(path, kind); const bad = Object.hasOwn(draft, path) && !valid(path, kind, draft[path]); const text = <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><strong>{title}</strong>{kind === 'boolean' ? <span>{t(key + 'Hint')}</span> : null}</span>; if (kind === 'boolean') return <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderTop: index ? '1px solid var(--dsw-alias-border-l2)' : 'none' }}>{text}{booleanControl(path, value, title)}</div>; return <label key={path} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0', borderTop: index ? '1px solid var(--dsw-alias-border-l2)' : 'none' }}>{text}<input type={kind === 'number' || kind === 'integer' ? 'number' : 'text'} min={path === 'r18P' || path === 'apiDelay' ? 0 : path === 'maxConcurrency' ? 1 : undefined} max={path === 'r18P' ? 1 : path === 'maxConcurrency' ? 10 : path === 'apiDelay' ? 10000 : undefined} step={kind === 'integer' ? 1 : kind === 'number' ? 'any' : undefined} value={value as string} disabled={!snapshot.writable} onChange={(e: { target: { value: string } }) => edit(path, e.target.value)} style={inputStyle(bad)} /><span>{bad ? t('invalid') : t(key + 'Hint')}</span></label> }) : null}
            {snapshot.status === 'ready' ? <div style={{ paddingTop: 18, borderTop: '1px solid var(--dsw-alias-border-l2)' }}><strong>{t('credentialsTitle')}</strong><p>{t('credentialsHint')}</p>{credentialSpecs.map(([ref, key, multiline]) => { const view = credentialViews[ref]; const value = credentialDraft[ref] ?? ''; let bad = false; if (multiline && value) { try { bad = !Array.isArray(JSON.parse(value)) } catch { bad = true } } return <label key={ref}><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><strong style={{ flex: 1 }}>{t(key)}</strong><span>{t(view?.configured ? 'configured' : 'missing')}</span>{view?.configured && view.writable ? <Button variant="outline" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); void clearCredential(ref) }}>{t('clearCredential')}</Button> : null}</span>{multiline ? <textarea rows={3} value={value} placeholder='[{"login":"...","apiKey":"..."}]' disabled={view?.writable !== true} onChange={(e: { target: { value: string } }) => editCredential(ref, e.target.value)} style={{ ...inputStyle(bad), fontFamily: 'monospace' }} /> : <input type="password" value={value} placeholder={view?.configured ? '••••••••' : ''} disabled={view?.writable !== true} onChange={(e: { target: { value: string } }) => editCredential(ref, e.target.value)} style={inputStyle(false)} />}<span>{view?.writable !== true ? t('credentialReadOnly') : bad ? t('invalid') : t(multiline ? 'keyPairsHint' : key + 'Hint')}</span></label> })}</div> : null}
            {snapshot.status === 'ready' && !snapshot.writable ? <p>{t('readOnly')}</p> : null}
            {snapshot.status === 'ready' ? <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 0 4px', borderTop: '1px solid var(--dsw-alias-border-l2)' }}>{failed ? <p>{t('saveFailed')}</p> : null}<Button variant="outline" disabled={!dirty || saving} onClick={() => { setDraft({}); setCredentialDraft({}); setFailed(false) }}>{t('discard')}</Button><Button variant="primary" disabled={(!canSaveConfig && !canSaveCredentials) || invalid || saving} onClick={save}>{saving ? t('saving') : t('save')}</Button></div> : null}
          </div> : null}
        </li>
      )
    }
    const inject = ['slots', 'locale', 'connection']
    function apply(ctx: any) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'pixluna: settings locale')
      const t = ctx.locale.bind(NS)
      const { api } = ctx.get('connection')
      const scope = ConfigController()
      ctx.effect(
        () => ctx.on('connection/reset', () => void scope.load()),
        'pixluna: refresh settings after reconnect'
      )
      ctx.slots.inject('settings.plugin.item', function* () {
        yield ctx.slots.register(
          { name: 'settings.plugin.item', id: 'pixluna', order: 30, locale: NS },
          () => <Card t={t} scope={scope} api={api} />
        )
      })
    }
    return { inject, apply }
  }
})
