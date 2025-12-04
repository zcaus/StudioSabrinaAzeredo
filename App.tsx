import React, { useState, useEffect } from 'react';
import { ViewState, Service } from './types';
import { dataManager } from './services/dataManager';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ServiceManager from './components/ServiceManager';
import Settings from './components/Settings';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple PIN protection for the "Demo" experience. 
    // In a real Supabase Auth flow, we would use supabase.auth.signInWithPassword
    if (password === '1234' || password === 'admin') {
      onLogin();
    } else {
      alert("Senha incorreta. (Dica: tente 1234)");
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f6f0] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-[#A0814A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
           <span className="text-3xl">💅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Studio Sabrina</h1>
        <p className="text-gray-500 mb-6 text-sm">Área Administrativa</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de acesso" 
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#A0814A] text-center text-lg"
          />
          <button type="submit" className="w-full bg-[#A0814A] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#856a3b] transition transform active:scale-95">
            Entrar
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-400">Dica: senha é "1234"</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [services, setServices] = useState<Service[]>([]);

  // Load auth state from session storage to persist refresh during dev
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setCurrentView('DASHBOARD');
    }
  }, []);

  // Fetch Services
  const loadServices = async () => {
    try {
      const data = await dataManager.getServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load services", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadServices();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuth', 'true');
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuth');
    setCurrentView('LOGIN');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
      {currentView === 'DASHBOARD' && <Dashboard services={services} />}
      {currentView === 'SERVICES' && <ServiceManager services={services} onUpdate={loadServices} />}
      {currentView === 'SETTINGS' && <Settings />}
    </Layout>
  );
};

export default App;