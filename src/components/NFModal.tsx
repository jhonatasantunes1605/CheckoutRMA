import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';

const NFModal: React.FC = () => {
  const { modalState, closeModal } = useModal();
  const { accessToken } = useAuth();
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  if (!modalState.isOpen) return null;

  const handleStartConferencia = () => {
    if (modalState.data?.chave) {
      window.localStorage.setItem('redirect_to_conferencia', modalState.data.chave);
      closeModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div className="bg-gray-800 text-white rounded-lg w-11/12 max-w-4xl max-h-[90vh] flex flex-col relative">
        <button 
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={closeModal}
        >
          <X size={24} />
        </button>
        
        <div className="p-5 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Detalhes da NFe</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          {modalState.loading ? (
            <p>Carregando detalhes...</p>
          ) : modalState.error ? (
            <p className="text-red-500">{modalState.error}</p>
          ) : (
            <>
              {modalState.data && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p><strong>Número:</strong> {modalState.data.nNF}</p>
                    <p><strong>Emissão:</strong> {modalState.data.dhEmi ? new Date(modalState.data.dhEmi).toLocaleString() : 'N/A'}</p>
                    <p><strong>Emitente:</strong> {modalState.data.emitente}</p>
                    <p><strong>Destinatário:</strong> {modalState.data.destinatario}</p>
                    <p><strong>Natureza da Operação:</strong> {modalState.data.natOp}</p>
                    
                    <button 
                      className="mt-2 bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                      onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                    >
                      {showAdditionalInfo ? 'Ocultar' : 'Exibir'} Informações Adicionais
                    </button>
                    
                    {showAdditionalInfo && (
                      <div className="mt-3 p-4 bg-gray-700 rounded">
                        <h4 className="text-lg font-medium mb-2">Informações Complementares</h4>
                        {modalState.data.infAdic ? (
                          <p className="text-sm"><strong>Informações Complementares:</strong> {modalState.data.infAdic}</p>
                        ) : null}
                        {modalState.data.infAdFisco ? (
                          <p className="text-sm mt-2"><strong>Informações Adicionais de Interesse do Fisco:</strong> {modalState.data.infAdFisco}</p>
                        ) : null}
                        {!modalState.data.infAdic && !modalState.data.infAdFisco ? (
                          <p className="text-sm italic">Nenhuma informação adicional disponível.</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Produtos ({modalState.data.produtos?.length || 0})</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-700">
                            <th className="p-2 text-left">EAN</th>
                            <th className="p-2 text-left">Produto</th>
                            <th className="p-2 text-left">Qtd.</th>
                            <th className="p-2 text-left">V. Unit.</th>
                            <th className="p-2 text-left">V. Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalState.data.produtos?.map((produto, index) => (
                            <tr key={index} className="border-t border-gray-700">
                              <td className="p-2">{produto.ean}</td>
                              <td className="p-2">{produto.nome}</td>
                              <td className="p-2">{produto.quantidade.toFixed(2)}</td>
                              <td className="p-2">R$ {produto.valorUnitario.toFixed(2)}</td>
                              <td className="p-2">R$ {produto.valorTotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded transition-colors"
                      onClick={handleStartConferencia}
                    >
                      Iniciar Conferência
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFModal;