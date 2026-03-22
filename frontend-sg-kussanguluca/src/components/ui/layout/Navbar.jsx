import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { FiLogOut, FiUser, FiMenu, FiBell } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

// Mapeia rotas para títulos legíveis
const TITULOS = {
  '/dashboard':  'Dashboard',
  '/receitas':   'Receitas',
  '/despesas':   'Despesas',
  '/relatorios': 'Relatórios',
  '/empresa':    'Empresas',
  '/saude':      'Saúde Financeira',
  '/fluxo':      'Fluxo de Caixa',
  '/contas':     'Contas',
  '/metas':      'Metas',
  '/perfil':     'Perfil',
};

const Navbar = ({ abrirSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const titulo = TITULOS[location.pathname] || 'Visão Geral';

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header
      className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 left-0 lg:left-64 z-10 transition-all duration-300"
      role="banner"
      aria-label="Barra de navegação principal"
    >
      <div className="flex items-center gap-3">
        {/* Botão hamburger — só visível em mobile */}
        <button
          onClick={abrirSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Abrir menu de navegação"
          aria-expanded="false"
        >
          <FiMenu size={22} />
        </button>

        {/* Título dinâmico da página actual */}
        <h2 className="text-base font-semibold text-gray-700">{titulo}</h2>
      </div>

      <nav aria-label="Acções do utilizador">
        <div className="flex items-center gap-2">

          {/* Notificações (placeholder) */}
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors relative"
            aria-label="Notificações"
            title="Notificações"
          >
            <FiBell size={19} />
          </button>

          {/* Perfil */}
          <button
            onClick={() => navigate('/perfil')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={`Perfil de ${user?.nome || 'Utilizador'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : <FiUser size={14} />}
            </div>
            <span className="font-medium text-gray-700 text-sm hidden md:block">
              {user?.nome || 'Utilizador'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Sair"
            aria-label="Terminar sessão"
          >
            <FiLogOut size={19} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;