import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const supabase = useSupabaseClient()
  const router   = useRouter()
  const [email, setEmail] = useState('')

  const send = async () => {
    await supabase.auth.signInWithOtp({ email })
    alert('Check your inbox for a login link')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 max-w-sm w-full bg-white rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Login / Magic Link</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)}
               className="border w-full mb-4 p-2 rounded" placeholder="your@email"/>
        <button onClick={send} className="w-full bg-indigo-600 text-white p-2 rounded">
          Send link
        </button>
      </div>
    </div>
  )
}
