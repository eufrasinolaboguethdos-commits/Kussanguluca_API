import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/ui/layout/Sidebar.jsx';
import Navbar from '../components/ui/layout/Navbar.jsx';
import BotaoAjuda from '../components/ui/BotaoAjuda';
import AgenteIA from '../components/ai/AgenteIA';
//import { useAuth } from '../hooks/useAuth';
import { useCompanyId } from '../hooks/useCompanyId';
import { receitaService } from '../services/receitaService';
import { despesaService } from '../services/despesaService';

const AppLayout = () => {
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const location = useLocation();
  const { activeCompany, companyId, loadingCompany } = useCompanyId();
  //const { user } = useAuth();

  const [statsIA, setStatsIA] = useState(null);

  const fecharSidebar = useCallback(() => setSidebarAberto(false), []);
  const abrirSidebar  = useCallback(() => setSidebarAberto(true),  []);

  useEffect(() => {
    if (!companyId || loadingCompany) return;

    let cancelled = false;

    async function carregarParaIA() {
      try {
        const [receitas, despesas] = await Promise.all([
          receitaService.getAll(companyId),
          despesaService.getAll(companyId),
        ]);

        if (cancelled) return;

        const totalReceitas = (receitas ?? []).reduce((s, r) => s + Number(r.valor ?? 0), 0);
        const totalDespesas = (despesas ?? []).reduce((s, d) => s + Number(d.valor ?? 0), 0);

        setStatsIA({
          totalReceitas,
          totalDespesas,
          saldo: totalReceitas - totalDespesas,
        });
      } catch {
        /* silencioso */
      }
    }

    carregarParaIA();
    return () => { cancelled = true; };
  }, [companyId, loadingCompany]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay para mobile */}
      {sidebarAberto && (
        <div
          className="fixed inset-0 z-10 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={fecharSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar aberto={sidebarAberto} fechar={fecharSidebar} />

      <div className="flex flex-1 flex-col transition-all duration-300 lg:ml-64">
        <Navbar abrirSidebar={abrirSidebar} />

        <main
          id="main-content"
          className="mt-16 flex-1 overflow-auto p-2 sm:p-3 md:p-6"
          role="main"
          aria-label="Conteúdo principal"
        >
          <div key={location.pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <BotaoAjuda />

        <AgenteIA empresa={activeCompany} stats={statsIA} />
      </div>
    </div>
  );
};

export default AppLayout;
