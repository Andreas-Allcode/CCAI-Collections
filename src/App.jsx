import './App.css'
import Pages from "@/pages/index.jsx"
import Login from "@/pages/Login.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    setIsLoggedIn(!!currentUser);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogin = () => {
    checkAuthStatus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        <Pages />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <Toaster />
      <SonnerToaster richColors />
    </>
  )
}

export default App