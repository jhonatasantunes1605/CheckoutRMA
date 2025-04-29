import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { toast } from 'react-hot-toast';

interface PendenteItem {
  id: string;
  chave: string;
  ts: Date;
  natOp?: string;
}

interface GroupedPendentes {
  [key: string]: {
    [dateKey: string]: PendenteItem[];
  };
}

const ProducaoPage: React.FC = () => {
  const { accessToken, isAuthenticated, login } = useAuth();
  const { openModal, setModalLoading, setModalData, setModalError } = useModal();
  const [loading, setLoading] = useState(false);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [groupedPendentes, setGroupedPendentes] = useState<GroupedPendentes>({});
  const [expandedOps, setExpandedOps] = useState<{[key: string]: boolean}>({});
  const [expandedDates, setExpandedDates] = useState<{[key: string]: boolean}>({});

  const sheetId = '1TrewcFAy17S5upNah2_XTGE8liivLGsjzj0y860XpCk';
  const pastaId = '1-3GvrQ8LXVmLuzqqwJ0c_gd0SqVdTPAR';

  useEffect(() => {
    if (isAuthenticated) {
      loadPendentes();
    }
  }, [isAuthenticated, accessToken]);
  
  const toggleOpGroup = (op: string) => {
    setExpandedOps(prev => ({ ...prev, [op]: !prev[op] }));
  };
  
  const toggleDateGroup = (opDate: string) => {
    setExpandedDates(prev => ({ ...prev, [opDate]: !prev[opDate] }));
  };

  const loadPendentes = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    setLoading(true);
    setPendentesCount(0);
    setGroupedPendentes({});

    try {
      // Get already processed NFes
      const sheetRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Checkout!A2:A`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const sheetData = await sheetRes.json();
      const conferidas = new Set((sheetData.values || []).map((row: string[]) => row[0]));

      // Get all XML files
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${pastaId}' in parents and mimeType='application/xml'`)}&fields=files(id,name,createdTime)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const driveData = await driveRes.json();
      
      // Filter and transform
      const pendentesMeta = (driveData.files || [])
        .map((f: any) => {
          const match = f.name.match(/(\d{44})/);
          return match
            ? {
                id: f.id,
                chave: match[1],
                ts: new Date(f.createdTime)
              }
            : null;
        })
        .filter((o: any) => o && !conferidas.has(o.chave))
        .sort((a: any, b: any) => b.ts.getTime() - a.ts.getTime());

      setPendentesCount(pendentesMeta.length);
      
      if (pendentesMeta.length > 0) {
        toast.success('Carregando natureza das operações...');
        
        // Enrich with operation type
        const enriched = await Promise.all(
          pendentesMeta.map(async (item: PendenteItem) => {
            try {
              const res = await fetch(
                `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
              );
              
              const xmlText = await res.text();
              const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
              const natOp = xml.querySelector('ide natOp')?.textContent || 'Não informado';
              
              return { ...item, natOp };
            } catch (error) {
              console.error('Erro ao ler XML:', error);
              return { ...item, natOp: 'Erro ao ler' };
            }
          })
        );

        // Group by operation type and then by date
        const grouped: GroupedPendentes = {};
        
        enriched.forEach(item => {
          const op = item.natOp || 'Não informado';
          const dateKey = item.ts.toLocaleDateString();
          
          if (!grouped[op]) {
            grouped[op] = {};
          }
          
          if (!grouped[op][dateKey]) {
            grouped[op][dateKey] = [];
          }
          
          grouped[op][dateKey].push(item);
        });
        
        setGroupedPendentes(grouped);
        
        // Initialize first level expanded
        const initialExpandedOps: {[key: string]: boolean} = {};
        Object.keys(grouped).forEach(op => {
          initialExpandedOps[op] = false;
        });
        setExpandedOps(initialExpandedOps);
      }

      toast.success('Dados carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar pendentes:', error);
      toast.error('Erro ao carregar dados pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (item: PendenteItem) => {
    openModal('Detalhes da NFe');
    setModalLoading(true);
    
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      const xmlText = await res.text();
      const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
      
      // Extract basic info
      const nNF = xml.querySelector('ide nNF')?.textContent || '';
      const dhEmi = xml.querySelector('ide dhEmi')?.textContent || '';
      const emitente = xml.querySelector('emit xNome')?.textContent || '';
      const destinatario = xml.querySelector('dest xNome')?.textContent || '';
      const natOp = xml.querySelector('ide natOp')?.textContent || '';
      
      // Extract additional info
      const infAdic = xml.querySelector('infAdic')?.querySelector('infCpl')?.textContent || '';
      const infAdFisco = xml.querySelector('infAdic')?.querySelector('infAdFisco')?.textContent || '';
      
      // Extract products
      const produtos = [];
      xml.querySelectorAll('det').forEach(det => {
        const ean = det.querySelector('cEAN')?.textContent || 'Sem EAN';
        const nome = det.querySelector('xProd')?.textContent || '';
        const quantidade = parseFloat(det.querySelector('qCom')?.textContent || '0');
        const valorUnitario = parseFloat(det.querySelector('vUnCom')?.textContent || '0');
        const valorTotal = parseFloat(det.querySelector('vProd')?.textContent || '0');
        
        produtos.push({ ean, nome, quantidade, valorUnitario, valorTotal });
      });
      
      setModalData({
        id: item.id,
        chave: item.chave,
        nNF,
        dhEmi,
        emitente,
        destinatario,
        natOp,
        infAdic,
        infAdFisco,
        produtos
      });
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setModalError('Erro ao carregar detalhes da NFe');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pendentes de Checkout</h1>
      
      <div className="fixed top-14 right-4 bg-yellow-600 text-black py-2 px-4 rounded-full font-medium shadow-lg">
        Total pendentes: {pendentesCount}
      </div>
      
      {!isAuthenticated && (
        <div className="bg-blue-900/50 p-4 rounded-lg mb-6">
          <p className="mb-3">Você precisa se autenticar para visualizar os pendentes.</p>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            onClick={login}
          >
            Fazer Login
          </button>
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={loadPendentes}
          disabled={loading}
          className={`px-5 py-2 rounded font-medium ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
          }`}
        >
          {loading ? 'Carregando...' : 'Atualizar Pendentes'}
        </button>
      </div>
      
      {loading && (
        <div className="text-center text-green-400 my-4">Carregando pendentes...</div>
      )}
      
      {!loading && pendentesCount === 0 && (
        <div className="bg-gray-800 p-5 rounded-lg text-center">
          <p>Nenhuma chave pendente.</p>
        </div>
      )}
      
      {!loading && pendentesCount > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedPendentes).map(([op, dates]) => (
            <div key={op} className="bg-gray-800 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-700 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleOpGroup(op)}
              >
                <span className="font-medium">{op}</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                    {Object.values(dates).flat().length} NF
                  </span>
                  {expandedOps[op] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>
              
              {expandedOps[op] && (
                <div className="p-3 space-y-2">
                  {Object.entries(dates).map(([dateKey, items]) => (
                    <div key={dateKey} className="rounded-lg overflow-hidden">
                      <div 
                        className="bg-blue-900 p-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleDateGroup(`${op}-${dateKey}`)}
                      >
                        <span className="text-sm flex items-center">
                          <FileText size={14} className="mr-2" /> {dateKey}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="bg-cyan-700 px-2 py-0.5 rounded-full text-xs">
                            {items.length} NF
                          </span>
                          {expandedDates[`${op}-${dateKey}`] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>
                      </div>
                      
                      {expandedDates[`${op}-${dateKey}`] && (
                        <div className="p-2 space-y-1">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                              onClick={() => handleOpenDetails(item)}
                            >
                              <div className="text-sm truncate">
                                {item.chave} – {item.ts.toLocaleTimeString()}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProducaoPage;