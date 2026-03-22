import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiPieChart, FiTrendingUp, FiTrendingDown, FiFileText,
  FiBriefcase, FiShield, FiCreditCard, FiTarget, FiActivity,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';

const Sidebar = () => {
  //const [financasAberto, setFinancasAberto] = useState(false);
  const [plataformaAberto, setPlataformaAberto] = useState(true);

  const menuPrincipal = [
    { name: 'Dashboard',   link: '/dashboard',  icon: FiPieChart },
    { name: 'Receitas',    link: '/receitas',   icon: FiTrendingUp },
    { name: 'Despesas',    link: '/despesas',   icon: FiTrendingDown },
    { name: 'Relatórios',  link: '/relatorios', icon: FiFileText },
    { name: 'Empresa',     link: '/empresa',    icon: FiBriefcase },
  ];

  const menuPlataforma = [
    { name: 'Saúde Financeira', link: '/saude',   icon: FiShield },
    { name: 'Fluxo de Caixa',   link: '/fluxo',   icon: FiActivity },
    { name: 'Contas',            link: '/contas',  icon: FiCreditCard },
    { name: 'Metas',             link: '/metas',   icon: FiTarget },
  ];

  const itemClass = ({ isActive }) =>
    `flex items-center gap-4 px-6 py-3.5 text-gray-100 transition duration-200 hover:bg-brand-600 ${
      isActive ? 'bg-brand-600 border-r-4 border-white font-semibold' : ''
    }`;

  return (
    <aside className="bg-brand-700 fixed h-screen w-64 hidden lg:flex flex-col transition-all duration-300 z-20 overflow-y-auto">

      {/* Logo */}
      <div className="h-16 flex items-center justify-center text-white font-bold text-xl shadow-md bg-brand-800 flex-shrink-0">
        SG Kussanguluca
      </div>

      <nav className="flex-1 py-4">

        {/* ── Secção Principal ── */}
        <div className="px-4 mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Principal</p>
        </div>
        <ul className="mb-4">
          {menuPrincipal.map((menu, i) => (
            <li key={i}>
              <NavLink to={menu.link} className={itemClass}>
                <menu.icon size={20} />
                <span className="font-medium text-sm">{menu.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Divisor */}
        <div className="mx-4 border-t border-brand-600 my-2" />

        {/* ── Secção Plataforma ── */}
        <div className="px-4 mt-4 mb-2">
          <button
            onClick={() => setPlataformaAberto(!plataformaAberto)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-300 hover:text-white transition-colors"
          >
            <span>Plataforma</span>
            {plataformaAberto
              ? <FiChevronUp size={14} />
              : <FiChevronDown size={14} />}
          </button>
        </div>

        {plataformaAberto && (
          <ul>
            {menuPlataforma.map((menu, i) => (
              <li key={i}>
                <NavLink to={menu.link} className={itemClass}>
                  <menu.icon size={20} />
                  <span className="font-medium text-sm">{menu.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 text-xs text-brand-300 text-center flex-shrink-0 border-t border-brand-600">
        © 2026 SG Kussanguluca
      </div>
    </aside>
  );
};

export default Sidebar;