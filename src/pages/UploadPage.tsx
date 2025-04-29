import React, { useState, useRef } from 'react';
import { Upload, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface UploadLog {
  name: string;
  success: boolean;
}

const UploadPage: React.FC = () => {
  const { accessToken, isAuthenticated, login } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const pastaId = '1-3GvrQ8LXVmLuzqqwJ0c_gd0SqVdTPAR';

  const handleUpload = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      toast.error('Selecione pelo menos um arquivo XML');
      return;
    }
    
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await uploadXML(file);
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const uploadXML = async (file: File) => {
    try {
      // Pre-check for duplicates
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${pastaId}' in parents and name='${file.name}'`)}&fields=files(id)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const checkData = await checkRes.json();
      if (checkData.files?.length) {
        logUpload(file.name, false);
        toast.error(`${file.name} já foi enviado anteriormente`);
        return;
      }
      
      // Upload file
      const metadata = {
        name: file.name,
        mimeType: 'application/xml',
        parents: [pastaId]
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);
      
      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: form
        }
      );
      
      const success = uploadRes.ok;
      logUpload(file.name, success);
      
      if (success) {
        toast.success(`${file.name} enviado com sucesso`);
      } else {
        toast.error(`Falha ao enviar ${file.name}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      logUpload(file.name, false);
      toast.error(`Erro ao processar ${file.name}`);
    }
  };
  
  const logUpload = (name: string, success: boolean) => {
    setLogs(prev => [{ name, success }, ...prev]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload de XML</h1>
      
      {!isAuthenticated && (
        <div className="bg-blue-900/50 p-4 rounded-lg mb-6">
          <p className="mb-3">Você precisa se autenticar para realizar uploads.</p>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            onClick={login}
          >
            Fazer Login
          </button>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="mb-4">
            <input
              type="file"
              id="fileInput"
              ref={fileInputRef}
              accept=".xml"
              multiple
              className="block w-full text-sm text-gray-300 
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-gray-700 file:text-gray-200
                hover:file:bg-gray-600 cursor-pointer"
            />
          </div>
          <button
            className={`flex items-center px-5 py-3 rounded font-medium transition-colors ${
              uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleUpload}
            disabled={uploading}
          >
            <Upload size={18} className="mr-2" />
            {uploading ? 'Enviando...' : 'Upload XML(s)'}
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Logs de Upload</h2>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <li 
                key={index} 
                className={`flex items-center justify-between p-3 rounded ${
                  log.success ? 'bg-green-900/30' : 'bg-red-900/30'
                }`}
              >
                <span className="truncate">{log.name}</span>
                {log.success ? (
                  <Check size={18} className="text-green-500 flex-shrink-0 ml-2" />
                ) : (
                  <X size={18} className="text-red-500 flex-shrink-0 ml-2" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadPage;