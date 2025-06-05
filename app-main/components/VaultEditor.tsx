'use client'
import { useVault } from '@/contexts/VaultStore'

export default function VaultEditor() {
  const { vault, updateItem } = useVault()
  if (!vault) return null
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Username</th>
            <th className="border px-2 py-1">Password</th>
            <th className="border px-2 py-1">URI</th>
          </tr>
        </thead>
        <tbody>
          {vault.items?.map((item: any, idx: number) => (
            <tr key={item.id} className="odd:bg-gray-50">
              <td className="border px-2 py-1">
                <input
                  className="w-full border px-1"
                  value={item.name || ''}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="w-full border px-1"
                  value={item.login?.username || ''}
                  onChange={(e) => updateItem(idx, 'username', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="w-full border px-1"
                  value={item.login?.password || ''}
                  onChange={(e) => updateItem(idx, 'password', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="w-full border px-1"
                  value={item.login?.uris?.[0]?.uri || ''}
                  onChange={(e) => updateItem(idx, 'uri', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
