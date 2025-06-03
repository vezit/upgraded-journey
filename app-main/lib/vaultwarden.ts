// lib/vaultwarden.ts
import axios from 'axios';

export async function getToken(apiUrl: string, id: string, secret: string) {
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: 'client_credentials',
    scope: 'api',
  }).toString();                                // <- stringify

  return axios.post(`${apiUrl}/identity/connect/token`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // <- force header
  });
}
