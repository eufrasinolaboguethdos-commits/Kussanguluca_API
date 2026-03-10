import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/layout/Sidebar.jsx';
import Navbar from '../components/ui/layout/Navbar.jsx';

const AppLayout = () => {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <Navbar />
        <main className="flex-1 p-6 mt-16 overflow-auto">
          {/* O Outlet é onde as páginas (Dashboard, Receitas, etc) serão carregadas */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;