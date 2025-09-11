import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';

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

function parseFileContent(content: string): Account[] {
  try {
    // Check if this might be a binary ODS file
    if (content.includes('PK\x03\x04') || content.includes('mimetypeapplication/vnd.oasis.opendocument.spreadsheet')) {
      throw new Error('This appears to be a binary ODS file. Please export/save your spreadsheet as CSV format and try again.');
    }

    // Parse tab-separated or comma-separated content
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File appears to be empty');
    }

    // Detect delimiter by checking the first few lines
    let delimiter = '\t';
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    
    if (commaCount > tabCount && commaCount > semicolonCount) {
      delimiter = ',';
    } else if (semicolonCount > tabCount && semicolonCount > commaCount) {
      delimiter = ';';
    }

    // Parse CSV properly handling quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Detect columns
    let { accountCol, passwordCol } = detectColumns(headers);
    
    if (!accountCol || !passwordCol) {
      const fallback = fallbackDetect(headers);
      accountCol = accountCol || fallback.accountCol;
      passwordCol = passwordCol || fallback.passwordCol;
    }

    if (!accountCol || !passwordCol) {
      throw new Error(`Could not detect required columns.\nAvailable columns: ${headers.join(', ')}\nTip: Make sure your file has columns named 'account'/'username' and 'password', or export as CSV with proper headers.`);
    }

    const accountIndex = headers.indexOf(accountCol);
    const passwordIndex = headers.indexOf(passwordCol);

    const accounts: Account[] = [];
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const row = parseCSVLine(lines[i]);
      
      if (row.length > Math.max(accountIndex, passwordIndex)) {
        const account = (row[accountIndex] || '').trim();
        const password = (row[passwordIndex] || '').trim();
        
        if (account && password && account !== 'undefined' && password !== 'undefined') {
          accounts.push({ account, password });
        }
      }
    }

    if (accounts.length === 0) {
      throw new Error('No valid account/password pairs found. Please check your file format and ensure it contains data rows.');
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
    // Log the first few characters to help debug
    console.log('Content preview:', content.substring(0, 200));
    console.log('Content length:', content.length);
    
    const accounts = parseFileContent(content);

    // Format output similar to the Python script
    const output = accounts.map(({ account, password }: Account) => `${account}: ${password}`).join('\n');

    // Build Bitwarden-compatible structure
    const bitwarden = {
      vaults: ['My Vault'],
      organizations: [],
      folders: [{ id: 'personal', name: 'Imported' }],
      items: accounts.map(({ account, password }: Account) => ({
        id: randomUUID(),
        type: 1,
        name: account,
        vault: 'My Vault',
        folderId: 'personal',
        login: {
          username: account,
          password,
          uris: []
        },
        fields: []
      }))
    };

    res.status(200).json({
      result: output,
      count: accounts.length,
      accounts: accounts,
      bitwarden
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process file'
    });
  }
}

