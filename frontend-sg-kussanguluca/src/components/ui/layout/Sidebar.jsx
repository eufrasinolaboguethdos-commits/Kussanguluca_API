import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiPieChart, FiTrendingUp, FiTrendingDown, FiFileText,
  FiBriefcase, FiShield, FiCreditCard, FiTarget, FiActivity,
  FiChevronDown, FiChevronUp, FiX, FiDollarSign
} from 'react-icons/fi';
//import { useCompanyId } from '../../../hooks/useCompanyId';


const Sidebar = ({ aberto, fechar }) => {
  const [plataformaAberto, setPlataformaAberto] = useState(true);
  //const { companyId } = useCompanyId();

  const menuPrincipal = [
    { name: 'Dashboard', link: '/dashboard', icon: FiPieChart },
    { name: 'Receitas', link: '/receitas', icon: FiTrendingUp },
    { name: 'Despesas', link: '/despesas', icon: FiTrendingDown },
    { name: 'Relatórios', link: '/relatorios', icon: FiFileText },
    { name: 'Empresa', link: '/empresa', icon: FiBriefcase },
  ];

  const menuPlataforma = [
    { name: 'Saúde Financeira', link: '/saude', icon: FiShield },
    { name: 'Fluxo de Caixa', link: '/fluxo', icon: FiActivity },
    { name: 'Contas', link: '/contas', icon: FiCreditCard },
    { name: 'Metas', link: '/metas', icon: FiTarget },
    { name: 'Taxa de Câmbio', link: '/taxa-cambio', icon: FiDollarSign },
  ];

  const itemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-gray-200 transition-all duration-150 hover:bg-brand-600/60 ${isActive ? 'bg-brand-600 text-white font-semibold shadow-sm' : ''
    }`;

  const handleNavClick = () => {
    if (fechar) fechar(); // fecha sidebar no mobile ao clicar num link
  };

  return (
    <>
      {/* ── Sidebar desktop (sempre visível em lg+) ── */}
      <aside
        className={`
          bg-brand-700 fixed h-screen w-64 flex flex-col z-20
          transition-transform duration-300 ease-in-out
          ${aberto ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        aria-label="Menu de navegação lateral"
        role="navigation"
      >
        {/* Logo + botão fechar mobile */}
        <div className="h-16 flex items-center justify-between px-4 bg-brand-800 flex-shrink-0">
          <span className="text-white font-bold text-lg tracking-tight">SG Kussanguluca</span>
          <button
            onClick={fechar}
            className="lg:hidden p-1.5 text-brand-300 hover:text-white hover:bg-brand-600 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Navegação principal">

          {/* Principal */}
          <div className="px-4 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Principal</p>
          </div>
          <ul role="list" className="mb-3 space-y-0.5">
            {menuPrincipal.map((menu, i) => (
              <li key={i}>
                <NavLink
                  to={menu.link}
                  className={itemClass}
                  onClick={handleNavClick}
                  aria-label={menu.name}
                >
                  <menu.icon size={18} aria-hidden="true" />
                  <span className="text-sm">{menu.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
              {/* Divisor */}
              <div className="mx-4 border-t border-brand-600 my-3" role="separator" />

              {/* Plataforma */}
              <div className="px-4 mb-2">
                <button
                  onClick={() => setPlataformaAberto(!plataformaAberto)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-400 hover:text-white transition-colors"
                  aria-expanded={plataformaAberto}
                  aria-controls="menu-plataforma"
                >
                  <span>Plataforma</span>
                  {plataformaAberto
                    ? <FiChevronUp size={13} aria-hidden="true" />
                    : <FiChevronDown size={13} aria-hidden="true" />}
                </button>
              </div>

              {plataformaAberto && (
                <ul id="menu-plataforma" role="list" className="space-y-0.5">
                  {menuPlataforma.map((menu, i) => (
                    <li key={i}>
                      <NavLink
                        to={menu.link}
                        className={itemClass}
                        onClick={handleNavClick}
                        aria-label={menu.name}
                      >
                        <menu.icon size={18} aria-hidden="true" />
                        <span className="text-sm">{menu.name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
        </nav>

        {/* Footer */}
        <div className="p-4 text-xs text-brand-400 text-center border-t border-brand-600 flex-shrink-0">
          © 2026 SG Kussanguluca
        </div>
      </aside>
    </>
  );
};

export default Sidebar;