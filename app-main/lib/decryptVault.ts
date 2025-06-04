import { decryptCipherString, unlockVault, KdfType } from './vaultCrypto';

export interface DecryptedCipher {
  id: string;
  name: string;
  username?: string;
  password?: string;
}

/**
 * Decrypt vault ciphers using the master password.
 * Expects sync data from /api/sync.
 */
export async function decryptVault(syncData: any, masterPassword: string): Promise<DecryptedCipher[]> {
  const profile = syncData.profile;
  if (!profile) throw new Error('Missing profile');

  const kdfType: KdfType = profile.kdf ?? profile.Kdf;
  const kdfIterations: number = profile.kdfIterations ?? profile.KdfIterations;
  const kdfMemory: number = profile.kdfMemory ?? profile.KdfMemory ?? 65536;
  const kdfParallelism: number = profile.kdfParallelism ?? profile.KdfParallelism ?? 4;

  const { encKey, macKey } = await unlockVault(
    profile.key,
    masterPassword,
    profile.email,
    kdfType,
    kdfIterations,
    kdfMemory,
    kdfParallelism,
  );

  const items: DecryptedCipher[] = [];
  for (const c of syncData.ciphers ?? []) {
    const item: DecryptedCipher = {
      id: c.id,
      name: await decryptCipherString(c.name, encKey, macKey),
    };
    if (c.login?.username) item.username = await decryptCipherString(c.login.username, encKey, macKey);
    if (c.login?.password) item.password = await decryptCipherString(c.login.password, encKey, macKey);
    items.push(item);
  }
  return items;
}
