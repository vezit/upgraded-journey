import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { supabaseConfigured } from '@/lib/supabaseClient'
import { InvoicePDF } from '@/templates/InvoicePDF'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!supabaseConfigured) {
    return res.status(501).json({ error: 'Supabase not configured' })
  }

  const supa = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supa.auth.getSession()
  if (!session) return res.status(401).json({ error: 'no session' })

  const { invoice } = req.body
  const fileName = `INV-${invoice.number}.pdf`
  const bucket = 'invoices'

  const stream = await renderToStream(<InvoicePDF invoice={invoice} />)

  const { data, error } = await supa.storage.from(bucket)
    .upload(fileName, stream, { contentType: 'application/pdf', upsert: true })
  if (error) return res.status(500).json(error)

  await supa.from('invoices').insert({
    number: invoice.number,
    user_id: session.user.id,
    data: invoice,
    pdf_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`,
  })

  res.status(200).json({ url: data?.path })
}
