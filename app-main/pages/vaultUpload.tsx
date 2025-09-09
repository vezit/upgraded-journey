import { useState } from 'react';

export default function VaultUpload() {
  const [fileContent, setFileContent] = useState('');
  const [output, setOutput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vaultUpload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: fileContent }),
    });
    const data = await res.json();
    setOutput(data.result || '');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vault Upload</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" accept=".odf" onChange={handleFileChange} />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={!fileContent}
        >
          Upload
        </button>
      </form>
      {output && (
        <pre className="mt-4 whitespace-pre-wrap">{output}</pre>
      )}
    </div>
  );
}

