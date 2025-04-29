import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Product {
  ean: string;
  nome: string;
}

interface NFData {
  chave: string;
  numero?: string;
  data?: string;
  emitente?: string;
  destinatario?: string;
}

const ConferenciaPage: React.FC = () => {
  const { accessToken, isAuthenticated, login, user } = useAuth();
  const [chave, setChave] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [nfData, setNfData] = useState<NFData>({ chave: '' });
  const [produtosPendentes, setProdutosPendentes] = useState<Product[]>([]);
  const [produtosConferidos, setProdutosConferidos] = useState<Product[]>([]);
  const [eanInput, setEanInput] = useState('');
  const eanInputRef = useRef<HTMLInputElement>(null);

  const sheetId = '1TrewcFAy17S5upNah2_XTGE8liivLGsjzj0y860XpCk';
  const pastaId = '1-3GvrQ8LXVmLuzqqwJ0c_gd0SqVdTPAR';

  useEffect(() => {
    // Check for redirect from modal
    const redirectChave = window.localStorage.getItem('redirect_to_conferencia');
    if (redirectChave) {
      setChave(redirectChave);
      window.localStorage.removeItem('redirect_to_conferencia');
      handleConferir(redirectChave);
    }
  }, []);

  useEffect(() => {
    // Focus on EAN input whenever it's cleared
    if (eanInput === '' && eanInputRef.current) {
      eanInputRef.current.focus();
    }
  }, [eanInput]);

  const handleConferir = async (chaveToCheck = chave) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!/^\d{44}$/.test(chaveToCheck)) {
      toast.error('Chave inválida. Deve conter 44 dígitos numéricos.');
      return;
    }

    setLoading(true);
    setCheckoutComplete(false);
    resetData();

    try {
      // Check if already checked out
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Checkout!A:A`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const checkData = await checkRes.json();
      
      if (checkData.values?.some((row: string[]) => row[0] === chaveToCheck)) {
        toast.error('Esta chave já foi conferida anteriormente');
        setLoading(false);
        return;
      }

      // Find XML file
      const query = `'${pastaId}' in parents and name contains '${chaveToCheck}'`;
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const searchData = await searchRes.json();
      
      if (!searchData.files || searchData.files.length === 0) {
        toast.error('Chave não encontrada');
        setLoading(false);
        return;
      }

      // Get XML content
      const xmlRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${searchData.files[0].id}?alt=media`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const xmlText = await xmlRes.text();
      parseXML(xmlText, chaveToCheck);
      loadProgress(chaveToCheck);
      toast.success('NFe carregada com sucesso');
    } catch (error) {
      console.error('Erro ao conferir:', error);
      toast.error('Erro ao buscar dados da NFe');
    } finally {
      setLoading(false);
    }
  };

  const parseXML = (xmlString: string, chaveAtual: string) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'application/xml');
    
    const ide = xml.querySelector('ide');
    const newNfData: NFData = {
      chave: chaveAtual,
      numero: ide?.querySelector('nNF')?.textContent || '',
      data: ide?.querySelector('dhEmi')?.textContent || '',
      emitente: xml.querySelector('emit xNome')?.textContent || '',
      destinatario: xml.querySelector('dest xNome')?.textContent || ''
    };
    
    setNfData(newNfData);
    
    const newProducts: Product[] = [];
    xml.querySelectorAll('det').forEach(det => {
      const ean = det.querySelector('cEAN')?.textContent || '';
      const nome = det.querySelector('xProd')?.textContent || '';
      const quantidade = parseInt(det.querySelector('qCom')?.textContent || '1');
      
      for (let i = 0; i < quantidade; i++) {
        newProducts.push({ ean, nome });
      }
    });
    
    setProdutosPendentes(newProducts);
    saveProgress(chaveAtual, newProducts, []);
  };

  const handleEanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEanInput(e.target.value);
  };

  const handleEanInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const ean = eanInput.trim();
      
      if (ean === '' || produtosPendentes.length === 0) return;
      
      const matchIndex = produtosPendentes.findIndex(p => p.ean === ean);
      
      if (matchIndex !== -1) {
        playBeep();
        const matchedProduct = produtosPendentes[matchIndex];
        const newPendentes = [...produtosPendentes];
        newPendentes.splice(matchIndex, 1);
        
        setProdutosPendentes(newPendentes);
        setProdutosConferidos([...produtosConferidos, matchedProduct]);
        setEanInput('');
        
        saveProgress(nfData.chave, newPendentes, [...produtosConferidos, matchedProduct]);
        
        if (newPendentes.length === 0) {
          finalizeCheckout();
        }
      } else {
        if (produtosConferidos.some(p => p.ean === ean)) {
          toast.error('EAN já conferido');
        } else {
          toast.error('EAN não encontrado na NFe');
        }
      }
    }
  };

  const loadProgress = (chave: string) => {
    const storedData = localStorage.getItem(`nf_${chave}`);
    if (storedData) {
      try {
        const { pend, conf } = JSON.parse(storedData);
        setProdutosPendentes(pend);
        setProdutosConferidos(conf);
        
        if (pend.length === 0 && conf.length > 0) {
          setCheckoutComplete(true);
        }
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    }
  };

  const saveProgress = (chave: string, pendentes: Product[], conferidos: Product[]) => {
    localStorage.setItem(`nf_${chave}`, JSON.stringify({ pend: pendentes, conf: conferidos }));
  };

  const finalizeCheckout = () => {
    setCheckoutComplete(true);
    
    const now = new Date();
    appendToSheet(nfData.chave, now, user.email);
  };

  const appendToSheet = async (chave: string, date: Date, email: string) => {
    try {
      const body = {
        values: [[chave, date.toLocaleString(), email]]
      };
      
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Checkout!A2:C:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );
      
      toast.success('Registro salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar na planilha:', error);
      toast.error('Erro ao salvar o registro');
    }
  };

  const resetData = () => {
    setProdutosPendentes([]);
    setProdutosConferidos([]);
    setNfData({ chave: '' });
  };

  const playBeep = () => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.connect(context.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Conferência de NFe</h1>
      
      {!isAuthenticated && (
        <div className="bg-blue-900/50 p-4 rounded-lg mb-6">
          <p className="mb-3">Você precisa se autenticar para realizar conferências.</p>
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
          placeholder="Digite a chave de acesso (44 dígitos)"
          value={chave}
          onChange={e => setChave(e.target.value)}
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => handleConferir()}
          disabled={loading}
          className={`flex items-center px-5 py-3 rounded font-medium ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
          }`}
        >
          <Search size={18} className="mr-2" />
          {loading ? 'Buscando...' : 'Conferir'}
        </button>
      </div>
      
      {checkoutComplete && (
        <div className="bg-green-600 text-white p-4 text-center text-lg font-medium rounded-lg mb-6 animate-pulse">
          ✅ Checkout concluído com sucesso!
        </div>
      )}
      
      {nfData.numero && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 p-5 rounded-lg">
              <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Informações da NFe</h2>
              <div className="space-y-2">
                <p><strong>Emitente:</strong> {nfData.emitente}</p>
                <p><strong>Destinatário:</strong> {nfData.destinatario}</p>
                <p><strong>Número:</strong> {nfData.numero}</p>
                <p><strong>Emissão:</strong> {nfData.data ? new Date(nfData.data).toLocaleString() : 'N/A'}</p>
                <p className="mt-3"><strong>Total EAN:</strong> {produtosPendentes.length + produtosConferidos.length}</p>
              </div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-lg">
              <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Conferência</h2>
              <div className="mb-3">
                <input
                  ref={eanInputRef}
                  type="text"
                  placeholder="Bipe o EAN"
                  value={eanInput}
                  onChange={handleEanInputChange}
                  onKeyDown={handleEanInputKeyDown}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-blue-500"
                  disabled={checkoutComplete || produtosPendentes.length === 0}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-red-900/30 p-2 rounded">
                  <span className="font-semibold">Pendentes:</span> {produtosPendentes.length}
                </div>
                <div className="bg-green-900/30 p-2 rounded">
                  <span className="font-semibold">Conferidos:</span> {produtosConferidos.length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <h3 className="bg-red-900/50 text-white p-3 font-medium flex items-center justify-between">
                Pendentes <span className="bg-red-800 px-2 py-1 rounded text-sm">{produtosPendentes.length}</span>
              </h3>
              <ul className="max-h-60 overflow-y-auto p-3 space-y-1">
                {produtosPendentes.length === 0 ? (
                  <li className="p-2 bg-gray-700/50 rounded text-center text-gray-400">Nenhum item pendente</li>
                ) : (
                  produtosPendentes.map((produto, index) => (
                    <li key={index} className="p-2 bg-gray-700/50 rounded text-sm">
                      <span className="font-mono">{produto.ean}</span> - {produto.nome}
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <h3 className="bg-green-900/50 text-white p-3 font-medium flex items-center justify-between">
                Conferidos <span className="bg-green-800 px-2 py-1 rounded text-sm">{produtosConferidos.length}</span>
              </h3>
              <ul className="max-h-60 overflow-y-auto p-3 space-y-1">
                {produtosConferidos.length === 0 ? (
                  <li className="p-2 bg-gray-700/50 rounded text-center text-gray-400">Nenhum item conferido</li>
                ) : (
                  produtosConferidos.map((produto, index) => (
                    <li key={index} className="p-2 bg-gray-700/50 rounded text-sm flex items-center">
                      <CheckSquare size={14} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>
                        <span className="font-mono">{produto.ean}</span> - {produto.nome}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConferenciaPage;