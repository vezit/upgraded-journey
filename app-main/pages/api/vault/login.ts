import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from '../../../lib/vaultwarden';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url, clientId, clientSecret } = req.body;
  try {
    const { data } = await getToken(url, clientId, clientSecret);
    res.status(200).json(data);          // {access_token, refresh_token, Key, ...}
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
