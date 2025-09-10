import type { NextApiRequest, NextApiResponse } from 'next';

interface Account {
  account: string;
  password: string;
}

const ACCOUNT_CANDIDATES = ["account", "username", "user", "login", "email"];
const PASSWORD_CANDIDATES = ["password", "pass"];

function normalize(name: string): string {
  return String(name).trim().toLowerCase().replace(/\s+/g, "_");
}

function detectColumns(headers: string[]): { accountCol: string | null; passwordCol: string | null } {
  const colsNorm: Record<string, string> = {};
  headers.forEach(header => {
    colsNorm[normalize(header)] = header;
  });

  let accountCol: string | null = null;
  for (const key of ACCOUNT_CANDIDATES) {
    if (key in colsNorm) {
      accountCol = colsNorm[key];
      break;
    }
    // Partial contains match
    for (const [norm, orig] of Object.entries(colsNorm)) {
      if (norm.includes(key)) {
        accountCol = orig;
        break;
      }
    }
    if (accountCol) break;
  }

  let passwordCol: string | null = null;
  for (const key of PASSWORD_CANDIDATES) {
    if (key in colsNorm) {
      passwordCol = colsNorm[key];
      break;
    }
    for (const [norm, orig] of Object.entries(colsNorm)) {
      if (norm.includes(key)) {
        passwordCol = orig;
        break;
      }
    }
    if (passwordCol) break;
  }

  return { accountCol, passwordCol };
}

function fallbackDetect(headers: string[]): { accountCol: string | null; passwordCol: string | null } {
  // If exactly two columns, assume first is account, second is password
  if (headers.length === 2) {
    return { accountCol: headers[0], passwordCol: headers[1] };
  }

  // Prefer one named + one Unnamed column
  const named = headers.filter(h => !h.startsWith("Unnamed"));
  const unnamed = headers.filter(h => h.startsWith("Unnamed"));
  if (named.length === 1 && unnamed.length === 1) {
    return { accountCol: named[0], passwordCol: unnamed[0] };
  }

  // Default to first two columns if available
  if (headers.length >= 2) {
    return { accountCol: headers[0], passwordCol: headers[1] };
  }

  return { accountCol: null, passwordCol: null };
}

function parseODSContent(content: string): Account[] {
  try {
    // Parse tab-separated or comma-separated content
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File appears to be empty');
    }

    // Try tab-separated first, then comma-separated
    let delimiter = '\t';
    if (lines[0].split('\t').length === 1 && lines[0].includes(',')) {
      delimiter = ',';
    }

    // Assume first line is headers
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    
    // Detect columns
    let { accountCol, passwordCol } = detectColumns(headers);
    
    if (!accountCol || !passwordCol) {
      const fallback = fallbackDetect(headers);
      accountCol = accountCol || fallback.accountCol;
      passwordCol = passwordCol || fallback.passwordCol;
    }

    if (!accountCol || !passwordCol) {
      throw new Error(`Could not detect required columns. Available columns: ${headers.join(', ')}`);
    }

    const accountIndex = headers.indexOf(accountCol);
    const passwordIndex = headers.indexOf(passwordCol);

    const accounts: Account[] = [];
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length > Math.max(accountIndex, passwordIndex)) {
        const account = (row[accountIndex] || '').trim();
        const password = (row[passwordIndex] || '').trim();
        
        if (account && password) {
          accounts.push({ account, password });
        }
      }
    }

    return accounts;
  } catch (error) {
    throw new Error(`Failed to parse content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { content } = req.body as { content?: string };
  if (!content) {
    return res.status(400).json({ error: 'No content provided' });
  }

  try {
    const accounts = parseODSContent(content);
    
    // Format output similar to the Python script
    const output = accounts.map(({ account, password }) => `${account}: ${password}`).join('\n');
    
    res.status(200).json({ 
      result: output,
      count: accounts.length,
      accounts: accounts
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    });
  }
}

