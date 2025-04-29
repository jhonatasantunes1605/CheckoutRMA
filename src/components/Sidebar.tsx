import React from 'react';
import { Upload, ClipboardCheck, Factory, History } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'upload', label: 'Upload', icon: <Upload size={18} /> },
    { id: 'conferencia', label: 'Conferência', icon: <ClipboardCheck size={18} /> },
    { id: 'producao', label: 'Produção', icon: <Factory size={18} /> },
    { id: 'history', label: 'Histórico', icon: <History size={18} /> },
  ];

  return (
    <div className="w-60 bg-gray-800 flex flex-col p-4 shadow-lg">
      <h2 className="text-xl font-semibold text-center mb-8 text-white">Ferramentas</h2>
      <div className="flex flex-col space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-md text-left transition-colors ${
              activePage === item.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setActivePage(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;