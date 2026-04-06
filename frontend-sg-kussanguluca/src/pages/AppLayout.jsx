import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/ui/layout/Sidebar.jsx';
import Navbar from '../components/ui/layout/Navbar.jsx';
import BotaoAjuda from '../components/ui/BotaoAjuda';
import AgenteIA from '../components/ai/AgenteIA';
import { useAuth } from '../hooks/useAuth';
import { useCompanyId } from '../hooks/useCompanyId';
import { receitaService } from '../services/receitaService';
import { despesaService } from '../services/despesaService';

const AppLayout = () => {
  const [sidebarAberto, setSidebarAberto] = useState(false);
  const location = useLocation();
  const { activeCompany, companyId, loadingCompany } = useCompanyId();
  const { user } = useAuth();

  const [statsIA, setStatsIA] = useState(null);

  // Carrega dados financeiros básicos para o Kuss
  useEffect(() => {
    if (!companyId || loadingCompany) return;
    async function carregarParaIA() {
      try {
        const [receitas, despesas] = await Promise.all([
          receitaService.getAll(companyId),
          despesaService.getAll(companyId),
        ]);
        const totalReceitas = (receitas || []).reduce((s, r) => s + Number(r.valor || 0), 0);
        const totalDespesas = (despesas || []).reduce((s, d) => s + Number(d.valor || 0), 0);
        setStatsIA({
          totalReceitas,
          totalDespesas,
          saldo: totalReceitas - totalDespesas,
        });
      } catch { /* silencioso */ }
    }
    carregarParaIA();
  }, [companyId, loadingCompany]);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {sidebarAberto && (
        <div
          className="fixed inset-0 bg-black/40 z-10 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarAberto(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar aberto={sidebarAberto} fechar={() => setSidebarAberto(false)} />

      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <Navbar abrirSidebar={() => setSidebarAberto(true)} />

        <main
          id="main-content"
          className="flex-1 p-2 sm:p-3 md:p-6 mt-16 overflow-auto"
          role="main"
          aria-label="Conteúdo principal"
        >
          <div key={location.pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <BotaoAjuda />

        {/* ← Agora passa os dados correctamente */}
        <AgenteIA
          empresa={activeCompany}
          stats={statsIA}
        />
      </div>
    </div>
  );
};

export default AppLayout;