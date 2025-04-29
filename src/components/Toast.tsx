import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isError?: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isError = false, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg transition-opacity 
        ${isError ? 'bg-red-600' : 'bg-green-600'} text-white z-50`}
    >
      {message}
    </div>
  );
};

export default Toast;