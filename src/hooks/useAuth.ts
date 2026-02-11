import { useState, useEffect, useCallback } from 'react';
import { authApi, isLoggedIn } from '@/services/api';

interface UseAuthOptions {
  onLogin: () => void;
  onLogout: () => void;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  showLoginModal: boolean;
  loginError: string | undefined;
  isLoggingIn: boolean;
  setShowLoginModal: (show: boolean) => void;
  setLoginError: (error: string | undefined) => void;
  handleLogin: (password: string) => Promise<void>;
  handleLogout: () => void;
}

export function useAuth({
  onLogin,
  onLogout,
}: UseAuthOptions): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsAuthenticated(loggedIn);
    if (loggedIn) {
      onLogin();
    }

    const handleAuthExpired = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [onLogin]);

  const handleLogin = useCallback(async (password: string) => {
    setIsLoggingIn(true);
    setLoginError(undefined);
    try {
      await authApi.login(password);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      onLogin();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setIsLoggingIn(false);
    }
  }, [onLogin]);

  const handleLogout = useCallback(() => {
    authApi.logout();
    setIsAuthenticated(false);
    onLogout();
  }, [onLogout]);

  return {
    isAuthenticated,
    showLoginModal,
    loginError,
    isLoggingIn,
    setShowLoginModal,
    setLoginError,
    handleLogin,
    handleLogout,
  };
}
