import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ConferenciaPage from './pages/ConferenciaPage';
import ProducaoPage from './pages/ProducaoPage';
import HistoryPage from './pages/HistoryPage';
import UserBadge from './components/UserBadge';
import { AuthProvider } from './contexts/AuthContext';
import NFModal from './components/NFModal';
import { ModalProvider } from './contexts/ModalContext';

function App() {
  const [activePage, setActivePage] = useState('upload');

  const renderPage = () => {
    switch (activePage) {
      case 'upload':
        return <UploadPage />;
      case 'conferencia':
        return <ConferenciaPage />;
      case 'producao':
        return <ProducaoPage />;
      case 'history':
        return <HistoryPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <AuthProvider>
      <ModalProvider>
        <div className="flex h-screen bg-gray-900 text-white">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
          <main className="flex-1 p-8 overflow-y-auto">
            {renderPage()}
          </main>
          <UserBadge />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
              },
              success: {
                style: {
                  background: '#28a745',
                },
              },
              error: {
                style: {
                  background: '#b00020',
                },
              },
            }}
          />
          <NFModal />
        </div>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;