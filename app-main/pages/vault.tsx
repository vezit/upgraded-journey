import { useState } from 'react';

export default function Vault() {
  const [url, setUrl] = useState('https://vault.vezit.net');       // default server
  const [id, setId] = useState('');      // client_id
  const [secret, setSecret] = useState('');  // client_secret
  const [master, setMaster] = useState('');  // master password
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Getting token…');
    const r = await fetch('/api/vault/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, clientId: id, clientSecret: secret }),
    }).then(r => r.json());

    if (r.access_token) {
      setToken(r.access_token);                   // store in memory; persist as needed
      setStatus('Token OK – now unlock vault locally');
      // TODO: derive KDF & decrypt r.Key with `master`, then call /api/vault/sync
    } else setStatus('Login failed');
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Vault Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input className="w-full p-2 border" value={url}     onChange={e=>setUrl(e.target.value)}     placeholder="Vaultwarden URL" />
        <input className="w-full p-2 border" value={id}      onChange={e=>setId(e.target.value)}      placeholder="client_id" />
        <input className="w-full p-2 border" value={secret}  onChange={e=>setSecret(e.target.value)}  placeholder="client_secret" />
        <input className="w-full p-2 border" type="password" value={master} onChange={e=>setMaster(e.target.value)} placeholder="master password" />
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">Login &amp; Sync</button>
      </form>
      <p className="mt-4 text-sm">{status}</p>
    </div>
  );
}
