import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Ticket,
  Home as HomeIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import AuthModal from '../auth/AuthModal';

const Header = () => {
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Início', path: '/', icon: HomeIcon },
    { name: 'Meus Tickets', path: '/meus-tickets', icon: Ticket, requireAuth: true }
  ];

  return (
    <>
             <header className="bg-black shadow-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
                             <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                 <Ticket className="w-5 h-5 text-white" />
               </div>
               <span className="text-xl font-bold text-white">
                RifaStatus
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                if (item.requireAuth && !currentUser) return null;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                                         className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                       isActivePage(item.path)
                         ? 'text-white bg-gray-800'
                         : 'text-gray-300 hover:text-white hover:bg-gray-800'
                     }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu / Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {currentUser ? (
                <div className="relative">
                                     <button
                     onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                           className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                   >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block">
                      {userData?.nome || currentUser.displayName || 'Usuário'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                 className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-xl ring-1 ring-gray-700 ring-opacity-5 focus:outline-none border border-gray-700"
                      >
                                                <div className="py-1">
                          <Link
                            to="/perfil"
                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-800"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <User className="w-4 h-4 mr-3" />
                            Meu Perfil
                          </Link>
                          
                          {isAdmin() && (
                            <Link
                              to="/admin"
                              className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-800"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4 mr-3" />
                              Dashboard Admin
                            </Link>
                          )}
                          
                          <Link
                            to="/meus-tickets"
                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-800"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Ticket className="w-4 h-4 mr-3" />
                            Meus Tickets
                          </Link>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sair
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Entrar
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
                         <button
               onClick={() => setIsMenuOpen(!isMenuOpen)}
                               className="md:hidden p-2 rounded-md text-white hover:bg-gray-800"
             >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
                             className="md:hidden bg-black border-t border-gray-800"
            >
              <div className="px-4 pt-2 pb-3 space-y-1">
                {navItems.map((item) => {
                  if (item.requireAuth && !currentUser) return null;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                                             className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                         isActivePage(item.path)
                           ? 'text-white bg-gray-800'
                           : 'text-gray-300 hover:text-white hover:bg-gray-800'
                       }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {currentUser ? (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="px-3 py-2 text-sm text-white">
                      {userData?.nome || currentUser.displayName || 'Usuário'}
                    </div>
                    
                    <Link
                      to="/perfil"
                      className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-white hover:bg-gray-800 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Meu Perfil</span>
                    </Link>
                    
                    {isAdmin() && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-white hover:bg-gray-800 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5" />
                        <span>Dashboard Admin</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 w-full text-left px-3 py-2 text-base font-medium text-white hover:bg-gray-800 rounded-md"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sair</span>
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Entrar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Modal */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Entrar na sua conta"
        size="sm"
      >
        <AuthModal 
          onSuccess={handleAuthSuccess}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default Header;
