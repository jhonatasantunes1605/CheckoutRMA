import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

interface User {
  email: string;
}

interface AuthContextType {
  user: User;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLocalMode: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: { email: '' },
  accessToken: null,
  isAuthenticated: false,
  isLocalMode: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>({ email: '' });
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const clientId = '794168976403-g75q12b0jv7frnu3vmg920r4i8e7st4m.apps.googleusercontent.com';

  useEffect(() => {
    // Check if running in local mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setIsLocalMode(true);
    }

    // Load Google client script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initGoogle = () => {
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });
  };

  const handleCredentialResponse = (response: any) => {
    console.log("Google auth response received");
  };

  const login = () => {
    if (!window.google) {
      toast.error('Google API não carregada');
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'openid',
          'email'
        ].join(' '),
        callback: async (resp: any) => {
          if (resp.error) {
            toast.error('Erro de autenticação');
            return;
          }

          setAccessToken(resp.access_token);
          await loadUserInfo(resp.access_token);
        }
      });

      // Force consent screen
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao iniciar autenticação');
    }
  };

  const loadUserInfo = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Falha ao obter informações do usuário');
      }
      
      const data = await res.json();
      setUser({ email: data.email });
      toast.success(`Bem-vindo, ${data.email}`);
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
      toast.error('Não foi possível obter dados do usuário');
    }
  };

  const logout = () => {
    setUser({ email: '' });
    setAccessToken(null);
    toast.success('Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken || isLocalMode,
        isLocalMode,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};