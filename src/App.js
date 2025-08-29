import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RaffleProvider } from './contexts/RaffleContext';
import Layout from './components/layout/Layout';
import AdminLayout from './pages/admin/AdminLayout';
import { adicionarControlesTeste } from './utils/testPaymentFlow';

// Pages
import Home from './pages/Home';
import RafflePage from './pages/RafflePage';
import MyTickets from './pages/MyTickets';
import Perfil from './pages/Perfil';
import TermosDeUso from './pages/TermosDeUso';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import RaffleManagement from './pages/admin/RaffleManagement';
import EditRaffle from './pages/admin/EditRaffle';
import Users from './pages/admin/Users';
import UserProfile from './pages/admin/UserProfile';
import Reports from './pages/admin/Reports';
import Draw from './pages/admin/Draw';
import Settings from './pages/admin/Settings';

function App() {
  // Adicionar controles de teste em desenvolvimento
  useEffect(() => {
    adicionarControlesTeste();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RaffleProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="rifa/:id" element={<RafflePage />} />
              <Route path="meus-tickets" element={<MyTickets />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="termos" element={<TermosDeUso />} />
              <Route path="privacidade" element={<PoliticaPrivacidade />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="rifas" element={<RaffleManagement />} />
              <Route path="rifas/editar/:id" element={<EditRaffle />} />
              <Route path="usuarios" element={<Users />} />
              <Route path="usuarios/:userId" element={<UserProfile />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="sorteios" element={<Draw />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                  <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                    Página não encontrada
                  </h2>
                  <p className="text-gray-500 mb-6">
                    A página que você procura não existe.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Voltar ao Início
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </RaffleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;


