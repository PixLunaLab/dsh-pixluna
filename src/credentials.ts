import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { PixLunaConfig } from './types'

export const PIXLUNA_CREDENTIAL_REFS = {
  pixivPhpSessId: 'PIXLUNA_PIXIV_PHPSESSID',
  danbooruKeyPairs: 'PIXLUNA_DANBOORU_KEY_PAIRS',
  e621KeyPairs: 'PIXLUNA_E621_KEY_PAIRS',
  gelbooruKeyPairs: 'PIXLUNA_GELBOORU_KEY_PAIRS',
  lolibooruKeyPairs: 'PIXLUNA_LOLIBOORU_KEY_PAIRS',
  sankakuKeyPairs: 'PIXLUNA_SANKAKU_KEY_PAIRS',
  konachanKeyPairs: 'PIXLUNA_KONACHAN_KEY_PAIRS',
  yandeKeyPairs: 'PIXLUNA_YANDE_KEY_PAIRS'
} as const

type CredentialKey = keyof typeof PIXLUNA_CREDENTIAL_REFS

const keyPairTargets = {
  danbooruKeyPairs: 'danbooru',
  e621KeyPairs: 'e621',
  gelbooruKeyPairs: 'gelbooru',
  lolibooruKeyPairs: 'lolibooru',
  sankakuKeyPairs: 'sankaku',
  konachanKeyPairs: 'konachan',
  yandeKeyPairs: 'yande'
} as const

function parseKeyPairs(value: string, ref: string): unknown[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error(`${ref} 必须是有效的 JSON 数组`)
  }
  if (!Array.isArray(parsed)) throw new Error(`${ref} 必须是 JSON 数组`)
  return parsed
}

/** Resolve credential-backed fields for one operation without caching secrets. */
export async function resolveCredentialConfig(
  ctx: Context,
  config: PixLunaConfig
): Promise<PixLunaConfig> {
  const credentials = ctx.get('credentials')
  if (!credentials) return config

  const resolved = structuredClone(config)
  const pixiv = await credentials.resolve(credentialRef(PIXLUNA_CREDENTIAL_REFS.pixivPhpSessId))
  if (pixiv) resolved.pixiv.phpSESSID = pixiv.value

  await Promise.all(
    Object.entries(keyPairTargets).map(async ([key, target]) => {
      const ref = PIXLUNA_CREDENTIAL_REFS[key as Exclude<CredentialKey, 'pixivPhpSessId'>]
      const credential = await credentials.resolve(credentialRef(ref))
      if (!credential) return
      resolved[target].keyPairs = parseKeyPairs(credential.value, ref) as never
    })
  )
  return resolved
}
