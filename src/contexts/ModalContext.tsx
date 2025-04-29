import React, { createContext, useState, useContext, ReactNode } from 'react';

interface NFProduct {
  ean: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface NFData {
  id?: string;
  chave?: string;
  nNF?: string;
  dhEmi?: string;
  emitente?: string;
  destinatario?: string;
  natOp?: string;
  infAdic?: string;
  infAdFisco?: string;
  produtos?: NFProduct[];
}

interface ModalState {
  isOpen: boolean;
  title?: string;
  loading: boolean;
  error: string | null;
  data: NFData | null;
}

interface ModalContextType {
  modalState: ModalState;
  openModal: (title?: string) => void;
  closeModal: () => void;
  setModalLoading: (loading: boolean) => void;
  setModalError: (error: string | null) => void;
  setModalData: (data: NFData) => void;
}

const initialModalState: ModalState = {
  isOpen: false,
  loading: false,
  error: null,
  data: null
};

const ModalContext = createContext<ModalContextType>({
  modalState: initialModalState,
  openModal: () => {},
  closeModal: () => {},
  setModalLoading: () => {},
  setModalError: () => {},
  setModalData: () => {}
});

export const useModal = () => useContext(ModalContext);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const openModal = (title?: string) => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      loading: false,
      error: null
    });
  };

  const closeModal = () => {
    setModalState({
      ...modalState,
      isOpen: false
    });
  };

  const setModalLoading = (loading: boolean) => {
    setModalState({
      ...modalState,
      loading
    });
  };

  const setModalError = (error: string | null) => {
    setModalState({
      ...modalState,
      error,
      loading: false
    });
  };

  const setModalData = (data: NFData) => {
    setModalState({
      ...modalState,
      data,
      loading: false,
      error: null
    });
  };

  return (
    <ModalContext.Provider
      value={{
        modalState,
        openModal,
        closeModal,
        setModalLoading,
        setModalError,
        setModalData
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};