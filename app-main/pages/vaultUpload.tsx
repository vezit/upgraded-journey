import { useState, useEffect } from 'react';
import * as storage from '@/lib/storage';
import VaultItemList from '@/components/VaultItemList';

interface Account {
  account: string;
  password: string;
}

export default function VaultUpload() {
  const [fileContent, setFileContent] = useState('');
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountCount, setAccountCount] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string, timestamp: number}>>([]);

  // Load cached uploaded files on component mount
  useEffect(() => {
    const loadUploadedFiles = () => {
      try {
        const cached = localStorage.getItem('uploaded-files');
        if (cached) {
          setUploadedFiles(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Failed to load cached files:', error);
      }
    };
    loadUploadedFiles();
  }, []);

  // Save uploaded file to cache
  const saveUploadedFile = (name: string, content: string) => {
    try {
      const newFile = { name, content, timestamp: Date.now() };
      const updatedFiles = [newFile, ...uploadedFiles.slice(0, 9)]; // Keep last 10 files
      setUploadedFiles(updatedFiles);
      localStorage.setItem('uploaded-files', JSON.stringify(updatedFiles));
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  // Load a cached file
  const loadCachedFile = (file: {name: string, content: string, timestamp: number}) => {
    setFileName(file.name);
    setFileContent(file.content);
    setOutput(''); // Clear previous output
    setAccounts([]);
    setAccountCount(0);
  };

  // Delete a cached file
  const deleteCachedFile = (timestamp: number) => {
    const updatedFiles = uploadedFiles.filter(f => f.timestamp !== timestamp);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploaded-files', JSON.stringify(updatedFiles));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput('Processing...');
    setAccounts([]);
    setAccountCount(0);
    
    try {
      const res = await fetch('/api/vaultUpload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setOutput(data.result || '');
        setAccounts(data.accounts || []);
        setAccountCount(data.count || 0);
        
        // Save the file to cache after successful upload
        if (fileName && fileContent) {
          saveUploadedFile(fileName, fileContent);
        }
      } else {
        setOutput(`Error: ${data.error || 'Failed to process file'}`);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">Vault Upload</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
          <h2 className="text-xl font-semibold mb-4">Upload New File</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                type="file" 
                accept=".csv,.tsv,.txt,.ods" 
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: CSV, TSV, TXT. For ODS files, please export as CSV first.
              </p>
              {fileName && (
                <p className="mt-2 text-sm text-gray-600">Selected: {fileName}</p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={!fileContent}
            >
              Upload & Process
            </button>
          </form>
          
          {accounts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">
                Extracted Accounts ({accountCount} found)
              </h3>
              <div className="bg-gray-50 border rounded-lg max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-gray-100 p-3 border-b font-semibold text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>Account</div>
                    <div>Password</div>
                  </div>
                </div>
                <div className="divide-y">
                  {accounts.map((account, index) => (
                    <div key={index} className="p-3 hover:bg-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="font-mono break-all">{account.account}</div>
                        <div className="font-mono break-all text-gray-600">{account.password}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {output && !accounts.length && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Output</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{output}</pre>
            </div>
          )}
        </div>

        {/* Cached Files Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recently Uploaded Files</h2>
          {uploadedFiles.length === 0 ? (
            <p className="text-gray-500">No cached files yet.</p>
          ) : (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={file.timestamp} className="border rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{file.name}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(file.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {(file.content.length / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => loadCachedFile(file)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteCachedFile(file.timestamp)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {uploadedFiles.length > 0 && (
            <button
              onClick={() => {
                setUploadedFiles([]);
                localStorage.removeItem('uploaded-files');
              }}
              className="mt-4 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
        </div>
      </div>
      <VaultItemList onEdit={() => {}} />
    </div>
  );
}

