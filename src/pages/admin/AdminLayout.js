import React, { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X,
  BarChart3,
  Ticket,
  Users,
  Settings,
  DollarSign,
  FileText,
  LogOut,
  Home as HomeIcon,
  Shuffle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminProvider from '../../contexts/AdminContext';
import Button from '../../components/ui/Button';

const AdminLayout = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificar se o usuário é admin
  if (!currentUser || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3, current: location.pathname === '/admin' },
    { name: 'Rifas', href: '/admin/rifas', icon: Ticket, current: location.pathname.startsWith('/admin/rifas') },
    { name: 'Usuários', href: '/admin/usuarios', icon: Users, current: location.pathname === '/admin/usuarios' },
    { name: 'Sorteios', href: '/admin/sorteios', icon: Shuffle, current: location.pathname === '/admin/sorteios' },
    { name: 'Relatórios', href: '/admin/relatorios', icon: FileText, current: location.pathname === '/admin/relatorios' },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, current: location.pathname === '/admin/configuracoes' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AdminProvider>
      <div className="min-h-screen flex bg-gray-100">
        {/* Sidebar Desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:h-full">
          <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">RifaStatus</span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Bottom Actions */}
              <div className="flex-shrink-0 px-2 pb-4 space-y-2">
                <Link
                  to="/"
                  className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <HomeIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Voltar ao Site
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
                onClick={() => setSidebarOpen(false)}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <Link to="/" className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold text-gray-900">RifaStatus</span>
                    </Link>
                    
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          item.current
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 flex-shrink-0 h-5 w-5 ${
                            item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Bottom Actions */}
                  <div className="flex-shrink-0 px-2 pb-4 space-y-2 border-t border-gray-200 pt-4">
                    <Link
                      to="/"
                      onClick={() => setSidebarOpen(false)}
                      className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <HomeIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      Voltar ao Site
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      Sair
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 md:ml-64 overflow-x-hidden">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <h1 className="text-lg font-semibold text-gray-900">
                  Painel Administrativo
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Bem-vindo, Admin!
                </span>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 focus:outline-none min-w-0">
            <div className="py-6 min-w-0">
              <div className="w-full px-2 sm:px-4 lg:px-6 min-w-0">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminProvider>
  );
};

export default AdminLayout;
