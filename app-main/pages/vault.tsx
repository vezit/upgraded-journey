// app-main/pages/vault.tsx – uses values from .env.local so there are **no input fields**
// -----------------------------------------------------------------------------
// Expected entries in `.env.local` (note the NEXT_PUBLIC_ prefix so the browser
// can read them):
// NEXT_PUBLIC_VAULT_URL=https://vault.vezit.net
// NEXT_PUBLIC_CLIENT_ID=user.1bcfca12-82a6-49f3-bae9-2907d78cd9c0
// NEXT_PUBLIC_CLIENT_SECRET=0SwiBZV8dyVvPmZ6H4fAJjUA6SY2KT
// # optional – only needed when you later decrypt the vault
// NEXT_PUBLIC_MASTER_PASSWORD=myMasterPassword
// -----------------------------------------------------------------------------

import { useState } from 'react';

/** Grab secrets from the env (Next.js exposes only *NEXT_PUBLIC_* on the client) */
const API_URL        = process.env.NEXT_PUBLIC_VAULT_URL     ?? '';
const CLIENT_ID      = process.env.NEXT_PUBLIC_CLIENT_ID     ?? '';
const CLIENT_SECRET  = process.env.NEXT_PUBLIC_CLIENT_SECRET ?? '';
const MASTER_PASSWORD = process.env.NEXT_PUBLIC_MASTER_PASSWORD ?? '';

if (!API_URL || !CLIENT_ID || !CLIENT_SECRET) {
  // eslint‑disable‑next‑line no-console
  console.warn('[Vault] Missing env variables – check your .env.local');
}

export default function Vault() {
  const [status, setStatus] = useState('');
  const [vaultData, setVaultData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  /** POST to /api/vault/sync and populate the view */
  async function fetchVaultData(token: string) {
    setStatus('Syncing vault…');
    const res = await fetch('/api/vault/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl: API_URL, token }),
    }).then(r => r.json());

    if (!res.error) {
      setVaultData(res);
      setStatus('Vault synced');
    } else {
      setStatus('Sync failed');
      setErrorMsg(res.error);
    }
  }

  /** Get OAuth token using the client‑credential flow */
  async function handleLogin() {
    setStatus('Getting token…');
    setErrorMsg('');

    const res = await fetch('/api/vault/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: API_URL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }),
    }).then(r => r.json());

    if (res.access_token) {
      setStatus('Token OK – syncing…');
      await fetchVaultData(res.access_token);
    } else {
      setStatus('Login failed');
      setErrorMsg(res.error ?? 'Unknown error – check the server logs');
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Vault Sync</h1>

      <button
        onClick={handleLogin}
        className="bg-primary hover:bg-primary/80 transition text-white px-4 py-2 rounded w-full"
      >
        Login &amp; Sync (env)
      </button>

      <p className="mt-4 text-sm text-secondary">{status}</p>
      {errorMsg && (
        <pre className="mt-2 p-2 bg-red-100 text-red-600 text-xs whitespace-pre-wrap break-all rounded">
          {errorMsg}
        </pre>
      )}

      {vaultData && (
        <pre className="mt-6 text-xs whitespace-pre-wrap break-all bg-gray-100 p-4 rounded max-h-[60vh] overflow-auto">
          {JSON.stringify(vaultData, null, 2)}
        </pre>
      )}

      {MASTER_PASSWORD === '' && (
        <p className="mt-4 text-xs text-yellow-600">
          ⚠️ <code>NEXT_PUBLIC_MASTER_PASSWORD</code> not set – you will only see the
          encrypted blob.
        </p>
      )}
    </div>
  );
}
