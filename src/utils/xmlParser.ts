export interface Product {
  ean: string;
  nome: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
}

export interface NFData {
  chave: string;
  numero?: string;
  data?: string;
  emitente?: string;
  destinatario?: string;
  natOp?: string;
  infAdic?: string;
  infAdFisco?: string;
  produtos?: Product[];
}

export const parseXML = (xmlString: string, chave: string): NFData => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, 'application/xml');
  
  const ide = xml.querySelector('ide');
  const infAdic = xml.querySelector('infAdic');
  
  const nfData: NFData = {
    chave,
    numero: ide?.querySelector('nNF')?.textContent || '',
    data: ide?.querySelector('dhEmi')?.textContent || '',
    emitente: xml.querySelector('emit xNome')?.textContent || '',
    destinatario: xml.querySelector('dest xNome')?.textContent || '',
    natOp: ide?.querySelector('natOp')?.textContent || '',
    infAdic: infAdic?.querySelector('infCpl')?.textContent || '',
    infAdFisco: infAdic?.querySelector('infAdFisco')?.textContent || '',
    produtos: []
  };
  
  const produtos: Product[] = [];
  xml.querySelectorAll('det').forEach(det => {
    const ean = det.querySelector('cEAN')?.textContent || '';
    const nome = det.querySelector('xProd')?.textContent || '';
    const quantidade = parseFloat(det.querySelector('qCom')?.textContent || '1');
    const valorUnitario = parseFloat(det.querySelector('vUnCom')?.textContent || '0');
    const valorTotal = parseFloat(det.querySelector('vProd')?.textContent || '0');
    
    // For simple product tracking (conferencia)
    for (let i = 0; i < quantidade; i++) {
      produtos.push({ ean, nome });
    }
    
    // For detailed product info (modal)
    nfData.produtos?.push({
      ean,
      nome,
      quantidade,
      valorUnitario,
      valorTotal
    });
  });
  
  return {
    ...nfData,
    produtos: nfData.produtos
  };
};