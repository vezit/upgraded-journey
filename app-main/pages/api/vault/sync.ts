import type { NextApiRequest, NextApiResponse } from 'next';
import { syncVault } from '../../../lib/vaultwarden';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiUrl, token } = req.body;
  try {
    const { data } = await syncVault(apiUrl, token);
    res.status(200).json(data);          // returns encrypted vault JSON
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
