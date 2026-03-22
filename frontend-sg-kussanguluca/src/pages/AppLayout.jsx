import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/ui/layout/Sidebar.jsx';
import Navbar from '../components/ui/layout/Navbar.jsx';

const AppLayout = () => {
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const location = useLocation();

  return (
    // ── Semântica HTML5: div raiz mantida para o flex funcionar
    <div className="flex bg-gray-100 min-h-screen">

      {/* Overlay mobile — fecha sidebar ao clicar fora */}
      {sidebarAberto && (
        <div
          className="fixed inset-0 bg-black/40 z-10 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (aside semântico) ── */}
      <Sidebar aberto={sidebarAberto} fechar={() => setSidebarAberto(false)} />

      {/* ── Área principal ── */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">

        {/* ── Navbar (header semântico) ── */}
        <Navbar abrirSidebar={() => setSidebarAberto(true)} />

        {/* ── Conteúdo principal ── */}
        <main
          id="main-content"
          className="flex-1 p-2 sm:p-3 md:p-6 mt-16 overflow-auto"
          role="main"
          aria-label="Conteúdo principal"
        >
          {/* Animação de transição entre páginas — key muda a cada rota */}
          <div
            key={location.pathname}
            className="animate-fade-in-up"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;