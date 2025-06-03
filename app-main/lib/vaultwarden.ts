// lib/vaultwarden.ts
import axios from 'axios';
import { randomUUID } from 'crypto';

// Stable device identifier for the runtime. Persist if you need it across runs.
const deviceId = randomUUID();

export async function getToken(apiUrl: string, id: string, secret: string) {
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: 'client_credentials',
    scope: 'api',
    // Vaultwarden requires these three additional fields
    deviceIdentifier: deviceId,
    deviceName: 'nextjs-app',
    deviceType: '8',
  }).toString();                                // <- stringify

  return axios.post(`${apiUrl}/identity/connect/token`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // <- force header
  });
}

export async function syncVault(apiUrl: string, token: string) {
  return axios.get(`${apiUrl}/api/sync`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
