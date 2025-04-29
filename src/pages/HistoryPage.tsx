import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface HistoryItem {
  chave: string;
  data: string;
  responsavel: string;
}

const HistoryPage: React.FC = () => {
  const { accessToken, isAuthenticated, login } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<HistoryItem[]>([]);

  const sheetId = '1TrewcFAy17S5upNah2_XTGE8liivLGsjzj0y860XpCk';

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, accessToken]);

  const loadHistory = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    setLoading(true);
    setHistoryData([]);
    setSearchResults([]);

    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Checkout!A2:C`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const data = await res.json();
      
      if (data.values) {
        const formattedData = data.values.map((row: string[]) => ({
          chave: row[0] || '',
          data: row[1] || '',
          responsavel: row[2] || ''
        }));
        
        setHistoryData(formattedData);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar dados de histórico');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const term = searchTerm.trim();
    
    if (!term) {
      toast.error('Digite uma chave para buscar');
      return;
    }
    
    const results = historyData.filter(item => item.chave.includes(term));
    
    setSearchResults(results);
    
    if (results.length > 0) {
      toast.success(`${results.length} resultado(s) encontrado(s)`);
    } else {
      toast.error('Nenhum resultado encontrado');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Histórico de Checkouts</h1>
      
      {!isAuthenticated && (
        <div className="bg-blue-900/50 p-4 rounded-lg mb-6">
          <p className="mb-3">Você precisa se autenticar para visualizar o histórico.</p>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            onClick={login}
          >
            Fazer Login
          </button>
        </div>
      )}
      
      <div className="flex items-center space-x-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar chave..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || historyData.length === 0}
          className={`flex items-center px-5 py-3 rounded font-medium ${
            loading || historyData.length === 0
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
          }`}
        >
          <Search size={18} className="mr-2" />
          Buscar
        </button>
      </div>
      
      {loading ? (
        <div className="text-center text-green-400 my-4">Carregando histórico...</div>
      ) : historyData.length === 0 ? (
        <div className="bg-gray-800 p-5 rounded-lg text-center">
          <p>Nenhum histórico disponível.</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left bg-gray-700 font-medium">Chave de Acesso</th>
                  <th className="p-3 text-left bg-gray-700 font-medium">Data</th>
                  <th className="p-3 text-left bg-gray-700 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((item, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="p-3 font-mono text-sm">{item.chave}</td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {item.data}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <User size={14} className="mr-2 text-gray-400" />
                        {item.responsavel}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : searchTerm ? (
        <div className="bg-gray-800 p-5 rounded-lg text-center">
          <p>Nenhum resultado encontrado para "{searchTerm}".</p>
        </div>
      ) : (
        <div className="bg-gray-800 p-5 rounded-lg text-center">
          <p>Digite uma chave para buscar no histórico.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;