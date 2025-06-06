import { base64ToBytes } from './vaultCrypto'

export const bytesToBase64 = (b: Uint8Array): string => Buffer.from(b).toString('base64')
export const utf8ToBytes = (s: string): Uint8Array => new TextEncoder().encode(s)
export const bytesToUtf8 = (b: Uint8Array): string => new TextDecoder().decode(b)

export const generateKey = (): string => {
  const arr = new Uint8Array(32)
  globalThis.crypto.getRandomValues(arr)
  return bytesToBase64(arr)
}

const subtle: SubtleCrypto = (globalThis.crypto as any).subtle

export async function encryptString(plain: string, keyB64: string): Promise<string> {
  const keyBytes = base64ToBytes(keyB64)
  const key = await subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv }, key, utf8ToBytes(plain))
  )
  return `${bytesToBase64(iv)}:${bytesToBase64(ct)}`
}

export async function decryptString(enc: string, keyB64: string): Promise<string> {
  const [ivB64, ctB64] = enc.split(':')
  const iv = base64ToBytes(ivB64)
  const ct = base64ToBytes(ctB64)
  const keyBytes = base64ToBytes(keyB64)
  const key = await subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const pt = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))
  return bytesToUtf8(pt)
}
