type ClientRequire = (id: string) => any
type FieldKind = 'boolean' | 'number' | 'integer' | 'text' | 'providers'
type FieldSpec = readonly [path: string, kind: FieldKind]
type CredentialSpec = readonly [ref: string, key: string, multiline?: boolean]
type DraftValue = string | boolean | null
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
  id: 'dsh-plugin-pixluna',
  factory: (require: ClientRequire) => {
    const React = require('react')
    const { jsx, jsxs } = require('react/jsx-runtime')

    const NS = 'pixluna.settings'
    const CONFIG_ENDPOINT = 'pixlunaConfig'

    const zh = {
      title: 'PixLuna',
      description: '配置图片来源、请求行为和 Pixiv 访问凭据。',
      expand: '展开设置',
      collapse: '收起设置',
      save: '保存',
      saving: '保存中…',
      discard: '放弃修改',
      reset: '恢复默认',
      overridden: '已覆盖',
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
      save: 'Save',
      saving: 'Saving…',
      discard: 'Discard',
      reset: 'Reset to default',
      overridden: 'Overridden',
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

    const get = (value: unknown, path: string): any =>
      path.split('.').reduce<any>((out, key) => out?.[key], value)
    const has = (value: unknown, path: string) => {
      const keys = path.split('.')
      let out = value as UnknownRecord | undefined
      for (const key of keys) {
        if (!out || !Object.hasOwn(out, key)) return false
        out = out[key] as UnknownRecord | undefined
      }
      return true
    }
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

    function ConfigController(rpc: any) {
      let snapshot: any = {
        status: 'loading',
        value: undefined,
        base: undefined,
        user: undefined,
        writable: false
      }
      const listeners = new Set<() => void>()
      const publish = (next: any) => {
        snapshot = next
        for (const listener of [...listeners]) listener()
      }
      const load = async () => {
        try {
          const result = await rpc.call('/api', `${CONFIG_ENDPOINT}/get`, { args: {} })
          if (!result.ok) throw new Error(result.error.message)
          const value = (result.value as any).config
          publish({
            status: 'ready',
            value,
            base: value,
            user: value,
            writable: (result.value as any).writable === true
          })
        } catch {
          publish({ ...snapshot, status: 'unavailable', writable: false })
        }
      }
      const setPath = (target: UnknownRecord, path: string, value: unknown) => {
        const keys = path.split('.')
        let out = target
        for (const key of keys.slice(0, -1)) out = (out[key] ??= {}) as UnknownRecord
        out[keys[keys.length - 1]] = value
      }
      const write = async (path: string, value: unknown) => {
        const patch: UnknownRecord = {}
        setPath(patch, path, value)
        const result = await rpc.call('/api', `${CONFIG_ENDPOINT}/set`, { args: { patch } })
        if (!result.ok) throw new Error(result.error.message)
        const config = (result.value as any).config
        publish({
          status: 'ready',
          value: config,
          base: config,
          user: config,
          writable: (result.value as any).writable === true
        })
      }
      void load()
      return {
        getSnapshot: () => snapshot,
        subscribe(listener: () => void) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        set: write,
        unset: (path: string) => write(path, get(snapshot.base, path)),
        load
      }
    }

    function Card({ t, scope, api }: { t: (key: string) => string; scope: any; api: any }) {
      const snapshot = React.useSyncExternalStore(
        scope.subscribe,
        scope.getSnapshot,
        scope.getSnapshot
      )
      const [open, setOpen] = React.useState(false)
      const [draft, setDraft] = React.useState({}) as [Draft, (value: any) => void]
      const [saving, setSaving] = React.useState(false)
      const [failed, setFailed] = React.useState(false)
      const [credentialDraft, setCredentialDraft] = React.useState({}) as [
        Record<string, string>,
        (value: any) => void
      ]
      const [credentialViews, setCredentialViews] = React.useState({}) as [
        Record<string, { configured: boolean; writable: boolean; source?: string }>,
        (value: any) => void
      ]
      React.useEffect(() => {
        let active = true
        api.credentials
          .describe({ refs: credentialSpecs.map(([ref]) => ref) })
          .then((response: any) => {
            if (active && response.result.ok) setCredentialViews(response.result.value.credentials)
          })
        return () => {
          active = false
        }
      }, [api])
      const dirty = Object.keys(draft).length > 0 || Object.values(credentialDraft).some(Boolean)
      const fieldValue = (path: string, kind: FieldKind) =>
        Object.hasOwn(draft, path) ? draft[path] : format(get(snapshot.value, path), kind)
      const invalidSettings = specs.some(
        ([path, kind]) => Object.hasOwn(draft, path) && !valid(path, kind, draft[path])
      )
      const invalidCredentials = credentialSpecs.some(([ref, _key, multiline]) => {
        const value = credentialDraft[ref]
        if (!multiline || !value) return false
        try {
          return !Array.isArray(JSON.parse(value))
        } catch {
          return true
        }
      })
      const invalid = invalidSettings || invalidCredentials
      if (snapshot.status === 'loading') return null

      const edit = (path: string, value: DraftValue) => {
        setFailed(false)
        setDraft((old: Draft) => ({ ...old, [path]: value }))
      }
      const reset = (path: string) => {
        setFailed(false)
        setDraft((old: Draft) => ({ ...old, [path]: null }))
      }
      const save = async () => {
        if (invalid || !dirty) return
        setSaving(true)
        setFailed(false)
        try {
          for (const [path, kind] of specs) {
            if (!Object.hasOwn(draft, path)) continue
            const value = draft[path]
            if (value === null) await scope.unset(path)
            else await scope.set(path, parse(value, kind))
          }
          for (const [ref] of credentialSpecs) {
            const value = credentialDraft[ref]
            if (!value) continue
            const stored = await api.credentials.set({ ref, value })
            if (!stored.result.ok) throw new Error(stored.result.error.message)
          }
          setDraft({})
          setCredentialDraft({})
          const described = await api.credentials.describe({
            refs: credentialSpecs.map(([ref]) => ref)
          })
          if (described.result.ok) setCredentialViews(described.result.value.credentials)
        } catch {
          setFailed(true)
        } finally {
          setSaving(false)
        }
      }

      return jsxs('section', {
        style: {
          border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 12,
          background: 'var(--dsw-alias-bg-layer-2)',
          overflow: 'hidden'
        },
        children: [
          jsxs('button', {
            type: 'button',
            onClick: () => setOpen(!open),
            style: {
              width: '100%',
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              gap: 12
            },
            children: [
              jsxs('span', {
                style: { flex: 1 },
                children: [
                  jsx('strong', {
                    style: { display: 'block', fontSize: 15 },
                    children: t('title')
                  }),
                  jsx('span', {
                    style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 13 },
                    children: t('description')
                  })
                ]
              }),
              dirty
                ? jsx('span', {
                    style: { color: 'var(--dsw-alias-brand-primary)', fontSize: 12 },
                    children: '●'
                  })
                : null,
              jsx('span', {
                'aria-label': open ? t('collapse') : t('expand'),
                children: open ? '⌃' : '⌄'
              })
            ]
          }),
          open
            ? jsxs('div', {
                style: {
                  borderTop: '1px solid var(--dsw-alias-border-l2)',
                  padding: '4px 16px 16px'
                },
                children: [
                  snapshot.status === 'unavailable'
                    ? jsx('p', { children: t('unavailable') })
                    : null,
                  snapshot.status === 'ready'
                    ? specs.map(([path, kind]) => {
                        const key = labelKey(path),
                          overridden =
                            draft[path] === null
                              ? false
                              : Object.hasOwn(draft, path) || has(snapshot.user, path)
                        const value = fieldValue(path, kind),
                          bad =
                            Object.hasOwn(draft, path) &&
                            draft[path] !== null &&
                            !valid(path, kind, draft[path])
                        return jsxs(
                          'label',
                          {
                            style: {
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              padding: '12px 0',
                              borderBottom: '1px solid var(--dsw-alias-border-l2)'
                            },
                            children: [
                              jsxs('span', {
                                style: { display: 'flex', gap: 8, alignItems: 'center' },
                                children: [
                                  jsx('strong', {
                                    style: { flex: 1, fontSize: 13 },
                                    children: t(key)
                                  }),
                                  overridden
                                    ? jsx('span', {
                                        style: {
                                          fontSize: 11,
                                          color: 'var(--dsw-alias-label-secondary)'
                                        },
                                        children: t('overridden')
                                      })
                                    : null,
                                  overridden
                                    ? jsx('button', {
                                        type: 'button',
                                        disabled: !snapshot.writable,
                                        onClick: (event: { preventDefault(): void }) => {
                                          event.preventDefault()
                                          reset(path)
                                        },
                                        style: {
                                          border: 0,
                                          background: 'transparent',
                                          color: 'var(--dsw-alias-brand-primary)',
                                          cursor: 'pointer'
                                        },
                                        children: t('reset')
                                      })
                                    : null
                                ]
                              }),
                              kind === 'boolean'
                                ? jsx('input', {
                                    type: 'checkbox',
                                    checked:
                                      draft[path] === null
                                        ? Boolean(get(snapshot.base, path))
                                        : Boolean(value),
                                    disabled: !snapshot.writable,
                                    onChange: (event: { target: { checked: boolean } }) =>
                                      edit(path, event.target.checked)
                                  })
                                : jsx('input', {
                                    type:
                                      kind === 'number' || kind === 'integer'
                                        ? 'number'
                                        : path === 'pixiv.phpSESSID'
                                          ? 'password'
                                          : 'text',
                                    value:
                                      draft[path] === null
                                        ? format(get(snapshot.base, path), kind)
                                        : value,
                                    disabled: !snapshot.writable,
                                    onChange: (event: { target: { value: string } }) =>
                                      edit(path, event.target.value),
                                    style: {
                                      height: 34,
                                      border: `1px solid ${bad ? 'var(--dsw-alias-label-error)' : 'var(--dsw-alias-border-l2)'}`,
                                      borderRadius: 8,
                                      background: 'var(--dsw-alias-bg-layer-3)',
                                      color: 'inherit',
                                      padding: '0 10px'
                                    }
                                  }),
                              jsx('span', {
                                style: {
                                  color: bad
                                    ? 'var(--dsw-alias-label-error)'
                                    : 'var(--dsw-alias-label-tertiary)',
                                  fontSize: 12
                                },
                                children: bad ? t('invalid') : t(`${key}Hint`)
                              })
                            ]
                          },
                          path
                        )
                      })
                    : null,
                  snapshot.status === 'ready'
                    ? jsxs('div', {
                        style: { paddingTop: 18 },
                        children: [
                          jsx('strong', {
                            style: { display: 'block', fontSize: 14 },
                            children: t('credentialsTitle')
                          }),
                          jsx('p', {
                            style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 },
                            children: t('credentialsHint')
                          }),
                          ...credentialSpecs.map(([ref, key, multiline]) => {
                            const view = credentialViews[ref]
                            const value = credentialDraft[ref] ?? ''
                            let bad = false
                            if (multiline && value) {
                              try {
                                bad = !Array.isArray(JSON.parse(value))
                              } catch {
                                bad = true
                              }
                            }
                            return jsxs(
                              'label',
                              {
                                style: {
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                  padding: '12px 0',
                                  borderBottom: '1px solid var(--dsw-alias-border-l2)'
                                },
                                children: [
                                  jsxs('span', {
                                    style: { display: 'flex', gap: 8, alignItems: 'center' },
                                    children: [
                                      jsx('strong', {
                                        style: { flex: 1, fontSize: 13 },
                                        children: t(key)
                                      }),
                                      jsx('span', {
                                        style: {
                                          fontSize: 11,
                                          color: view?.configured
                                            ? 'var(--dsw-alias-state-success-primary)'
                                            : 'var(--dsw-alias-label-tertiary)'
                                        },
                                        children: t(view?.configured ? 'configured' : 'missing')
                                      }),
                                      view?.configured && view.writable
                                        ? jsx('button', {
                                            type: 'button',
                                            onClick: async (event: { preventDefault(): void }) => {
                                              event.preventDefault()
                                              const removed = await api.credentials.unset({ ref })
                                              if (removed.result.ok)
                                                setCredentialViews(
                                                  (old: typeof credentialViews) => ({
                                                    ...old,
                                                    [ref]: { configured: false, writable: true }
                                                  })
                                                )
                                            },
                                            style: {
                                              border: 0,
                                              background: 'transparent',
                                              color: 'var(--dsw-alias-brand-primary)',
                                              cursor: 'pointer'
                                            },
                                            children: t('clearCredential')
                                          })
                                        : null
                                    ]
                                  }),
                                  multiline
                                    ? jsx('textarea', {
                                        rows: 3,
                                        value,
                                        placeholder: '[{"login":"...","apiKey":"..."}]',
                                        disabled: view?.writable === false,
                                        onChange: (event: { target: { value: string } }) =>
                                          setCredentialDraft((old: Record<string, string>) => ({
                                            ...old,
                                            [ref]: event.target.value
                                          })),
                                        style: {
                                          border: `1px solid ${bad ? 'var(--dsw-alias-label-error)' : 'var(--dsw-alias-border-l2)'}`,
                                          borderRadius: 8,
                                          background: 'var(--dsw-alias-bg-layer-3)',
                                          color: 'inherit',
                                          padding: 10,
                                          fontFamily: 'monospace'
                                        }
                                      })
                                    : jsx('input', {
                                        type: 'password',
                                        value,
                                        placeholder: view?.configured ? '••••••••' : '',
                                        disabled: view?.writable === false,
                                        onChange: (event: { target: { value: string } }) =>
                                          setCredentialDraft((old: Record<string, string>) => ({
                                            ...old,
                                            [ref]: event.target.value
                                          })),
                                        style: {
                                          height: 34,
                                          border: '1px solid var(--dsw-alias-border-l2)',
                                          borderRadius: 8,
                                          background: 'var(--dsw-alias-bg-layer-3)',
                                          color: 'inherit',
                                          padding: '0 10px'
                                        }
                                      }),
                                  jsx('span', {
                                    style: {
                                      color: bad
                                        ? 'var(--dsw-alias-label-error)'
                                        : 'var(--dsw-alias-label-tertiary)',
                                      fontSize: 12
                                    },
                                    children:
                                      view?.writable === false
                                        ? t('credentialReadOnly')
                                        : bad
                                          ? t('invalid')
                                          : t(multiline ? 'keyPairsHint' : `${key}Hint`)
                                  })
                                ]
                              },
                              ref
                            )
                          })
                        ]
                      })
                    : null,
                  !snapshot.writable
                    ? jsx('p', {
                        style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 },
                        children: t('readOnly')
                      })
                    : null,
                  failed
                    ? jsx('p', {
                        style: { color: 'var(--dsw-alias-label-error)', fontSize: 12 },
                        children: t('saveFailed')
                      })
                    : null,
                  jsxs('div', {
                    style: { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 14 },
                    children: [
                      jsx('button', {
                        type: 'button',
                        disabled: !dirty || saving,
                        onClick: () => {
                          setDraft({})
                          setCredentialDraft({})
                        },
                        children: t('discard')
                      }),
                      jsx('button', {
                        type: 'button',
                        disabled: !dirty || invalid || saving || !snapshot.writable,
                        onClick: save,
                        children: saving ? t('saving') : t('save')
                      })
                    ]
                  })
                ]
              })
            : null
        ]
      })
    }

    const inject = ['slots', 'locale', 'connection']
    function apply(ctx: any) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'pixluna: settings locale')
      const t = ctx.locale.bind(NS)
      const { api, rpc } = ctx.get('connection')
      const scope = ConfigController(rpc)
      ctx.effect(
        () => ctx.on('connection/reset', () => void scope.load()),
        'pixluna: refresh settings after reconnect'
      )
      ctx.slots.inject('settings.plugin.item', function* () {
        yield ctx.slots.register(
          { name: 'settings.plugin.item', id: 'pixluna', order: 30, locale: NS },
          () => jsx(Card, { t, scope, api })
        )
      })
    }
    return { inject, apply }
  }
})
