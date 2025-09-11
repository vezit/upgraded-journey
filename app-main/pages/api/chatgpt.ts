import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: `You are a specialized AI assistant that helps users map out their digital services and create secure password vault diagrams. Your primary goal is to:

          1. **Service Discovery**: Help users identify all their online accounts (Netflix, LinkedIn, Gmail, banking, social media, work tools, etc.)
          2. **Security Mapping**: Understand their current security setup (passwords, 2FA methods, recovery options)
          3. **Vault Planning**: Guide them to organize services into a secure, recoverable structure
          4. **Generate Vault Data**: When ready, create Bitwarden-compatible JSON data they can download

          **Your Process:**
          - Ask about their services one category at a time (entertainment, social, work, finance, etc.)
          - For each service, ask about: username/email, 2FA method, recovery options
          - Suggest security improvements (recovery nodes, 2FA setup, password strength)
          - When they have 3+ services mapped, offer to generate their vault diagram

          **Important**: Always be encouraging and explain WHY certain security practices matter. Make security accessible, not intimidating.

          When generating vault data, use this JSON structure:
          \`\`\`json
          {
            "folders": [{"id": "personal", "name": "Personal Vault"}],
            "items": [
              {
                "id": "unique-id",
                "type": 1,
                "name": "Service Name",
                "folderId": "personal",
                "login": {
                  "username": "user@example.com",
                  "password": "",
                  "uris": [{"uri": "https://service.com", "match": null}]
                },
                "fields": [
                  {"name": "vaultdiagram", "value": "{\"id\":\"service-id\",\"logoUrl\":\"https://service.com/favicon.ico\"}", "type": 0}
                ]
              }
            ]
          }
          \`\`\`

          Be conversational and helpful! 🔐`
        },
        ...messages
      ],
      max_completion_tokens: 2000,
      temperature: 1,
    })

    const aiMessage = completion.choices[0]?.message?.content

    if (!aiMessage) {
      return res.status(500).json({ error: 'No response received from AI' })
    }

    // Check if the response contains vault JSON data
    const jsonMatch = aiMessage.match(/```json\s*(\{[\s\S]*?\})\s*```/)
    let attachment = null
    
    if (jsonMatch) {
      try {
        const vaultData = JSON.parse(jsonMatch[1])
        if (vaultData.items && Array.isArray(vaultData.items)) {
          // Generate unique filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
          const filename = `vault-diagram-${timestamp}.json`
          
          attachment = {
            filename,
            data: vaultData,
            type: 'vault-json',
            size: JSON.stringify(vaultData, null, 2).length
          }
        }
      } catch (error) {
        console.error('Error parsing vault JSON:', error)
      }
    }

    res.status(200).json({ 
      message: aiMessage,
      attachment: attachment
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({ 
        error: 'AI service error',
        details: error.message
      })
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
