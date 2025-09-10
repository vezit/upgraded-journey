// pages/about.tsx
import VaultItemList from '@/components/VaultItemList'

export default function About() {
  return (
    <div className="p-10 flex gap-8">
      <div className="flex-1">
        <h1 className="text-3xl font-semibold">About Victor Reipur</h1>
        <p className="mt-4 text-lg">This is a placeholder for about page content.</p>
      </div>
      <VaultItemList onEdit={() => {}} />
    </div>
  )
}
