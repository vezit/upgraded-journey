/*
 * lib/vaultCrypto.ts – Bitwarden/Vaultwarden decryption helpers
 * -------------------------------------------------------------
 * ✔ Supports **PBKDF2-SHA256** _and_ **Argon2id** (via `argon2-browser`).
 * ✔ Works in browser and Node/SSR (the Argon2 WASM is lazy-loaded on client).
 * ✔ Uses only WebCrypto APIs for AES/HMAC (no Node-only crypto).
 */

//---------------------------------------------------------------
// SubtleCrypto (browser & Node ≥20)
//---------------------------------------------------------------
const subtle: SubtleCrypto = (globalThis.crypto as any).subtle;

//---------------------------------------------------------------
// Utility helpers
//---------------------------------------------------------------
export const base64ToBytes = (b64: string): Uint8Array =>
  Uint8Array.from(Buffer.from(b64, 'base64'));

export const bytesToUtf8 = (b: Uint8Array): string => new TextDecoder().decode(b);

const concatBytes = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
};

/** Constant-time comparison */
const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

//---------------------------------------------------------------
// KDFs
//---------------------------------------------------------------
export async function deriveMasterKeyPBKDF2(
  password: string,
  email: string,
  iterations: number,
): Promise<ArrayBuffer> {
  const passKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(email),
      iterations,
      hash: 'SHA-256',
    },
    passKey,
    256,
  );
}

export interface Argon2Params {
  iterations: number;  // time cost
  memory: number;      // KiB
  parallelism: number; // threads
}

export async function deriveMasterKeyArgon2id(
  password: string,
  email: string,
  p: Argon2Params,
): Promise<ArrayBuffer> {
  // Lazy import so the WASM only loads in browser
  const { hash, ArgonType } = await import('argon2-browser/dist/argon2-bundled.min.js');
  const res: any = await hash({
    pass: password,
    salt: email,
    time: p.iterations,
    mem: p.memory,
    parallelism: p.parallelism,
    hashLen: 32,
    type: ArgonType.Argon2id,
    raw: true,
  });
  return new Uint8Array(res.hash).buffer;
}

//---------------------------------------------------------------
// HKDF split (SHA-256)
//---------------------------------------------------------------
const hkdf = async (ikm: ArrayBuffer, info: string): Promise<Uint8Array> => {
  const ikmKey = await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode(info) },
    ikmKey,
    256,
  );
  return new Uint8Array(bits);
};

//---------------------------------------------------------------
// CipherString parsing
//---------------------------------------------------------------
export interface ParsedCipherString {
  encType: number;
  iv: Uint8Array;
  ct: Uint8Array;
  mac?: Uint8Array;
  raw: string;
}

export const parseCipherString = (str: string): ParsedCipherString => {
  const [typeStr, data] = str.split('.', 2);
  const encType = parseInt(typeStr, 10);
  const [ivB64, ctB64, macB64] = data.split('|');
  return {
    encType,
    iv: base64ToBytes(ivB64),
    ct: base64ToBytes(ctB64),
    mac: macB64 ? base64ToBytes(macB64) : undefined,
    raw: str,
  };
};

//---------------------------------------------------------------
// AES-256-CBC decrypt helper
//---------------------------------------------------------------
async function aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ct: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await subtle.importKey('raw', key, 'AES-CBC', false, ['decrypt']);
  const pt = new Uint8Array(await subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ct));
  return pt.slice(0, pt.length - pt[pt.length - 1]); // strip PKCS#7 padding
}

//---------------------------------------------------------------
// HMAC-SHA256
//---------------------------------------------------------------
async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await subtle.sign('HMAC', k, data));
}

//---------------------------------------------------------------
// Decrypt profile.Key → Vault Enc/Mac keys
//---------------------------------------------------------------
export async function decryptProtectedKey(cipher: string, masterKey: ArrayBuffer) {
  const p = parseCipherString(cipher);

  if (p.encType === 0) {
    const plain = await aesCbcDecrypt(new Uint8Array(masterKey), p.iv, p.ct);
    return { encKey: plain.slice(0, 32), macKey: plain.slice(32, 64) };
  }

  if (p.encType === 2) {
    const masterEncKey = await hkdf(masterKey, 'enc');
    const masterMacKey = await hkdf(masterKey, 'mac');

    if (!p.mac) throw new Error('Protected key missing MAC');
    const macCheck = await hmacSha256(masterMacKey, concatBytes(p.iv, p.ct));
    if (!constantTimeEqual(macCheck, p.mac)) throw new Error('Protected Key MAC mismatch');

    const plain = await aesCbcDecrypt(masterEncKey, p.iv, p.ct);
    return { encKey: plain.slice(0, 32), macKey: plain.slice(32, 64) };
  }

  throw new Error(`Unsupported encType ${p.encType}`);
}

//---------------------------------------------------------------
// Decrypt any vault field (encType 2)
//---------------------------------------------------------------
export async function decryptCipherString(cipher: string, encKey: Uint8Array, macKey: Uint8Array) {
  const p = parseCipherString(cipher);
  if (p.encType !== 2 || !p.mac) throw new Error('Unsupported cipher or missing MAC');
  const macCheck = await hmacSha256(macKey, concatBytes(p.iv, p.ct));
  if (!constantTimeEqual(macCheck, p.mac)) throw new Error('Item MAC mismatch');
  const plain = await aesCbcDecrypt(encKey, p.iv, p.ct);
  return bytesToUtf8(plain);
}

//---------------------------------------------------------------
// High-level unlock helper
//---------------------------------------------------------------
export type KdfType = 0 | 1;
export async function unlockVault(
  protectedKey: string,
  masterPassword: string,
  email: string,
  kdfType: KdfType,
  kdfIterations: number,
  kdfMemory = 65536,
  kdfParallelism = 4,
) {
  const masterKey = kdfType === 0
    ? await deriveMasterKeyPBKDF2(masterPassword, email, kdfIterations)
    : await deriveMasterKeyArgon2id(masterPassword, email, { iterations: kdfIterations, memory: kdfMemory, parallelism: kdfParallelism });

  return decryptProtectedKey(protectedKey, masterKey);
}