// Handles token + unlock, nothing else.
import axios from 'axios';

export async function getToken(apiUrl: string, id: string, secret: string) {
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: 'client_credentials',
    scope: 'api',
  });
  return axios.post(`${apiUrl}/identity/connect/token`, body);
}

export async function syncVault(apiUrl: string, bearer: string) {
  return axios.get(`${apiUrl}/api/sync`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
}
