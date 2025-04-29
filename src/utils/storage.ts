import { Product } from './xmlParser';

export const saveProgress = (chave: string, pendentes: Product[], conferidos: Product[]) => {
  localStorage.setItem(`nf_${chave}`, JSON.stringify({ pend: pendentes, conf: conferidos }));
};

export const loadProgress = (chave: string): { pend: Product[], conf: Product[] } | null => {
  const storedData = localStorage.getItem(`nf_${chave}`);
  if (!storedData) return null;
  
  try {
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error parsing stored progress:', error);
    return null;
  }
};

export const clearProgress = (chave: string) => {
  localStorage.removeItem(`nf_${chave}`);
};