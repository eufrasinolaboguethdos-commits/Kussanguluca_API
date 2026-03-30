import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiHelpCircle, FiX, FiChevronRight } from 'react-icons/fi';

// ── Conteúdo de ajuda por rota ──────────────────────────────
const AJUDA = {
  '/dashboard': {
    titulo: 'Dashboard',
    descricao: 'O painel principal mostra um resumo completo da tua situação financeira.',
    passos: [
      'Os 3 cards no topo mostram receitas, despesas e saldo total',
      'Os widgets de Saúde, Meta e Contas dão acesso rápido à plataforma',
      'Os gráficos mostram a distribuição e evolução mensal',
      'As transações recentes listam os últimos movimentos',
    ],
    dica: 'Clica em qualquer widget para ir directamente à página detalhada.',
  },
  '/receitas': {
    titulo: 'Receitas',
    descricao: 'Regista e gere todas as entradas de dinheiro da tua empresa.',
    passos: [
      'Clica em "Nova Receita" para registar uma entrada',
      'Usa a pesquisa para encontrar receitas específicas',
      'Filtra por categoria ou período usando o botão Filtros',
      'Clica no ícone de editar ou eliminar para gerir registos',
    ],
    dica: 'Exporta as receitas em CSV para análise no Excel.',
  },
  '/despesas': {
    titulo: 'Despesas',
    descricao: 'Controla todas as saídas de dinheiro da tua empresa.',
    passos: [
      'Clica em "Nova Despesa" para registar uma saída',
      'O alerta laranja aparece quando as despesas ultrapassam 100.000 AOA',
      'Filtra por categoria ou período para análises específicas',
      'Ordena por data ou valor clicando nos cabeçalhos da tabela',
    ],
    dica: 'Mantém as categorias organizadas para relatórios mais precisos.',
  },
  '/relatorios': {
    titulo: 'Relatórios',
    descricao: 'Gera relatórios financeiros detalhados em PDF ou Excel.',
    passos: [
      'Selecciona o período (data início e data fim)',
      'Escolhe o tipo de relatório: Completo, Receitas ou Despesas',
      'Clica em "Gerar PDF" ou "Gerar Excel" para descarregar',
      'O relatório inclui resumo executivo, tabelas e indicadores',
    ],
    dica: 'O nome do ficheiro inclui o período seleccionado para fácil identificação.',
  },
  '/empresa': {
    titulo: 'Empresas',
    descricao: 'Gere as tuas empresas e selecciona qual usar na plataforma.',
    passos: [
      'Clica em "Nova Empresa" para criar uma empresa',
      'Clica em "Selecionar" para activar uma empresa',
      'A empresa activa aparece com borda azul e badge "Ativa"',
      'Podes editar os dados de qualquer empresa a qualquer momento',
    ],
    dica: 'Todos os dados (receitas, despesas, metas) são separados por empresa.',
  },
  '/saude': {
    titulo: 'Saúde Financeira',
    descricao: 'Avaliação automática da situação financeira da tua empresa.',
    passos: [
      '🟢 Verde — situação saudável, despesas controladas',
      '🟡 Amarelo — atenção, despesas entre 60-80% das receitas',
      '🔴 Vermelho — crítico, despesas acima de 80% ou saldo negativo',
      'A pontuação vai de 0 a 100 baseada em vários indicadores',
    ],
    dica: 'Verifica a saúde financeira regularmente para agir antes de problemas.',
  },
  '/fluxo': {
    titulo: 'Fluxo de Caixa',
    descricao: 'Histórico real e projecção dos próximos 3 meses.',
    passos: [
      'As barras mostram receitas e despesas reais por mês',
      'A linha roxa mostra a evolução do saldo',
      'A tabela em baixo mostra a projecção dos próximos 3 meses',
      'O alerta vermelho aparece quando se prevê saldo negativo',
    ],
    dica: 'A projecção é calculada com base na média dos últimos meses.',
  },
  '/contas': {
    titulo: 'Contas',
    descricao: 'Gere contas a pagar e a receber com alertas de vencimento.',
    passos: [
      'Usa as abas para ver contas a Pagar ou a Receber',
      'Contas a vermelho estão vencidas — paga ou cancela urgentemente',
      'Clica em "Pagar" para marcar uma conta como paga',
      'O resumo no topo mostra totais e contas em atraso',
    ],
    dica: 'Activa alertas para receber notificações antes do vencimento.',
  },
  '/metas': {
    titulo: 'Metas',
    descricao: 'Define e acompanha metas financeiras mensais.',
    passos: [
      'Clica em "Definir Meta" para criar a meta do mês',
      'A barra verde mostra o progresso da meta de receita',
      'A barra de despesas fica amarela quando próxima do limite',
      'O histórico mostra o desempenho dos meses anteriores',
    ],
    dica: 'Define uma meta realista baseada nos meses anteriores.',
  },
  '/perfil': {
    titulo: 'Perfil',
    descricao: 'Gere as tuas informações pessoais e senha de acesso.',
    passos: [
      'Usa a aba "Informações" para actualizar nome e email',
      'Usa a aba "Senha" para alterar a palavra-passe',
      'A senha actual é sempre necessária para fazer alterações',
      'As alterações são guardadas imediatamente',
    ],
    dica: 'Usa uma senha forte com letras, números e símbolos.',
  },
  '/transacoes': {
    titulo: 'Transações',
    descricao: 'Vista combinada de todas as receitas e despesas.',
    passos: [
      'Usa os botões Todos / ↑ / ↓ para filtrar por tipo',
      'Pesquisa por descrição ou categoria',
      'Ordena por data ou valor clicando nos cabeçalhos',
      'Exporta todas as transações em CSV',
    ],
    dica: 'Esta página é ideal para análise completa do período.',
  },
};

const AJUDA_PADRAO = {
  titulo: 'SG Kussanguluca',
  descricao: 'Plataforma de gestão financeira para empresas angolanas.',
  passos: [
    'Usa o menu lateral para navegar entre módulos',
    'O Dashboard dá uma visão geral da tua situação',
    'Regista receitas e despesas regularmente',
    'Usa os relatórios para análises detalhadas',
  ],
  dica: 'Começa por criar uma empresa e depois regista as primeiras transações.',
};

const BotaoAjuda = () => {
  const location = useLocation();
  const [aberto, setAberto] = useState(false);
  //const [animado, setAnimado] = useState(false);
  const painelRef = useRef(null);

  const ajuda = AJUDA[location.pathname] || AJUDA_PADRAO;

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClick = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Pulsa suavemente ao mudar de página para chamar atenção
  /*useEffect(() => {
    setAberto(false);
    setAnimado(true);
    const t = setTimeout(() => setAnimado(false), 1000);
    return () => clearTimeout(t);
  }, [location.pathname]);
*/
  return (
    <div className="fixed bottom-6 right-6 z-50" ref={painelRef}>

      {/* Painel de ajuda */}
      {aberto && (
        <div className="absolute bottom-16 right-0 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mb-2">

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiHelpCircle size={16} className="text-white" />
              <span className="text-white font-bold text-sm">{ajuda.titulo}</span>
            </div>
            <button onClick={() => setAberto(false)} className="text-white/70 hover:text-white transition-colors">
              <FiX size={16} />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">{ajuda.descricao}</p>

            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Como usar</p>
              {ajuda.passos.map((passo, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[9px] font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{passo}</p>
                </div>
              ))}
            </div>

            {/* Dica */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-bold">💡 Dica: </span>{ajuda.dica}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center">SG Kussanguluca — Gestão Financeira</p>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(!aberto)}
        className={`w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-gray-300 shadow-sm flex items-center justify-center transition-all duration-300 opacity-30 hover:opacity-100 hover:bg-gradient-to-br hover:from-brand-500 hover:to-blue-600 hover:text-white hover:scale-110 hover:shadow-xl ${aberto ? 'rotate-12 opacity-100 bg-gradient-to-br from-brand-500 to-blue-600 text-white' : ''}`}
        aria-label="Ajuda"
        title="Ajuda"
      >
        <FiHelpCircle size={22} />
      </button>
    </div>
  );
};

export default BotaoAjuda;