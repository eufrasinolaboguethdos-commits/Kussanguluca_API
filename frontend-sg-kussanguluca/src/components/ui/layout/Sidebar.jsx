import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiPieChart, FiTrendingUp, FiTrendingDown, FiFileText, FiBriefcase } from 'react-icons/fi';

const Sidebar = () => {
  const menus = [
    { name: 'Dashboard', link: '/dashboard', icon: FiPieChart },
    { name: 'Receitas', link: '/receitas', icon: FiTrendingUp },
    { name: 'Despesas', link: '/despesas', icon: FiTrendingDown },
    { name: 'Relatórios', link: '/relatorios', icon: FiFileText },
    { name: 'Empresa', link: '/empresa', icon: FiBriefcase }, // Exemplo extra
  ];

  return (
    <aside className="bg-brand-700 fixed h-screen w-64 hidden lg:flex flex-col transition-all duration-300 z-20">
      <div className="h-16 flex items-center justify-center text-white font-bold text-2xl shadow-md bg-brand-800">
        SG Kussanguluca
      </div>

      <nav className="flex-1 py-6">
        <ul>
          {menus.map((menu, index) => (
            <li key={index}>
              <NavLink
                to={menu.link}
                className={({ isActive }) => `
                  flex items-center gap-4 px-6 py-4 text-gray-100 transition duration-200 hover:bg-brand-600
                  ${isActive ? 'bg-brand-600 border-r-4 border-white' : ''}
                `}
              >
                <menu.icon size={22} />
                <span className="font-medium">{menu.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 text-sm text-brand-200 text-center">
        © 2024 SG Finance
      </div>
    </aside>
  );
};

export default Sidebar;