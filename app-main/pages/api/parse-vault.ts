import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { z } from 'zod'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// Zod validator for strict schema enforcement
const VaultSchema = z.object({
  vaults: z.array(z.string()),
  organizations: z.array(z.string()),
  folders: z.array(z.object({ id: z.string(), name: z.string() })),
  items: z.array(z.object({
    id: z.string(),
    type: z.literal(1),
    name: z.string(),
    vault: z.string().optional().default("personal"),
    folderId: z.string().optional().default("personal"),
    login: z.object({
      username: z.string(),
      password: z.string(),
      uris: z.array(z.object({ uri: z.string(), match: z.null() }).strict()).optional().default([])
    }),
    fields: z.array(z.object({
      name: z.string(),
      value: z.string(),
      type: z.number()
    })).optional().default([])
  }))
}).strict()

const SYSTEM = `You convert messy credential notes into strict JSON only.
Output must be a single JSON object that matches the provided schema. Do not add commentary.`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text } = req.body as { text?: string }
  if (!text) return res.status(400).json({ error: 'Missing text' })

  const userPrompt = `Schema (must match exactly):
{
  "vaults": [string],
  "organizations": [string],
  "folders": [{"id": "string", "name": "string"}],
  "items": [{
    "id": "string",
    "type": 1,
    "name": "string",
    "vault": "string",
    "folderId": "string",
    "login": {"username": "string", "password": "string", "uris": [ {"uri": "string", "match": null} ]},
    "fields": [{"name": "string", "value": "string", "type": 0}]
  }]
}

Rules:
- Parse rows into items. If a URL is present, set it in login.uris[0].uri; otherwise use [].
- If a row has multiple usernames, pick the most credential-like (email > user > label).
- Generate secure random passwords for items that don't have passwords specified.
- Use "personal" as default vault and folderId.
- Add a vaultdiagram field with logoUrl from the domain if a URL is present.
- All output must be valid JSON that matches the schema exactly.
- Generate unique IDs using random strings.

Data to parse:
${text}`

  // Small helper to call the model with JSON-only output
  async function callModel() {
    const resp = await client.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      temperature: 0,
      response_format: { type: 'json_object' }, // forces valid JSON
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 2000
    })
    return resp.choices[0]?.message?.content ?? ''
  }

  // Retry up to 3 times if validation fails
  const attempts = 3
  for (let i = 0; i < attempts; i++) {
    try {
      const content = await callModel()
      const parsed = JSON.parse(content)
      
      // Post-process to ensure proper structure and add missing fields
      if (parsed.items && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map((item: any) => {
          // Ensure proper structure
          const processedItem = {
            id: item.id || crypto.randomUUID(),
            type: 1,
            name: item.name || 'Unnamed Service',
            vault: item.vault || 'personal',
            folderId: item.folderId || 'personal',
            login: {
              username: item.login?.username || '',
              password: item.login?.password || '',
              uris: item.login?.uris || []
            },
            fields: item.fields || []
          }

          // Add vaultdiagram field if URL is present
          const uri = processedItem.login.uris?.[0]?.uri
          if (uri) {
            try {
              const domain = new URL(uri).hostname.replace(/^www\./, '')
              const vaultDiagram = {
                id: `${processedItem.name.toLowerCase().replace(/\s+/g, '-')}-${processedItem.id.slice(-4)}`,
                logoUrl: `https://${domain}/favicon.ico`
              }
              processedItem.fields.push({
                name: 'vaultdiagram',
                value: JSON.stringify(vaultDiagram),
                type: 0
              })
            } catch (e) {
              // If URL parsing fails, use default logo
              const vaultDiagram = {
                id: `${processedItem.name.toLowerCase().replace(/\s+/g, '-')}-${processedItem.id.slice(-4)}`,
                logoUrl: '/img/default.svg'
              }
              processedItem.fields.push({
                name: 'vaultdiagram',
                value: JSON.stringify(vaultDiagram),
                type: 0
              })
            }
          }

          return processedItem
        })
      }

      // Ensure default structure
      const finalData = {
        vaults: parsed.vaults || ['personal'],
        organizations: parsed.organizations || [],
        folders: parsed.folders || [{ id: 'personal', name: 'Personal Vault' }],
        items: parsed.items || []
      }

      const data = VaultSchema.parse(finalData)
      return res.status(200).json({ data }) // 🎉 valid
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err)
      if (i === attempts - 1) {
        return res.status(422).json({ 
          error: 'Invalid JSON per schema', 
          details: String(err),
          attempt: i + 1 
        })
      }
      // Continue to next retry
    }
  }
}
