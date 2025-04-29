import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserBadge: React.FC = () => {
  const { user, isLocalMode } = useAuth();

  if (!user.email && !isLocalMode) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-700 text-white py-2 px-4 rounded shadow-md flex items-center space-x-2">
      <User size={16} />
      <span className="text-sm">
        {isLocalMode ? 'Modo local' : user.email}
      </span>
    </div>
  );
};

export default UserBadge;