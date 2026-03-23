import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiLogOut, FiUser, FiMenu, FiBell,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle,
  FiInfo, FiShield, FiTarget, FiActivity,
  FiDollarSign, FiClock, FiX, FiChevronRight
} from 'react-icons/fi';
import { notificacaoService } from '../../../services/notificacaoService';
import { useCompanyId } from '../../../hooks/useCompanyId';

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
  '/taxa-cambio': 'Taxa de Câmbio',
};

// Ícone por tipo de notificação
const IconeNotificacao = ({ icone, tipo }) => {
  const cores = {
    erro:    'text-rose-500 bg-rose-50',
    aviso:   'text-amber-500 bg-amber-50',
    sucesso: 'text-emerald-500 bg-emerald-50',
    info:    'text-blue-500 bg-blue-50',
  };
  const icons = {
    alerta:  FiAlertTriangle,
    relogio: FiClock,
    escudo:  FiShield,
    alvo:    FiTarget,
    grafico: FiActivity,
    dinheiro: FiDollarSign,
  };
  const Icone = icons[icone] || FiInfo;
  return (
    <div className={`p-2 rounded-xl flex-shrink-0 ${cores[tipo] || cores.info}`}>
      <Icone size={15} />
    </div>
  );
};

// Badge colorido por tipo
const BADGE = {
  erro:    'bg-rose-100 text-rose-700',
  aviso:   'bg-amber-100 text-amber-700',
  sucesso: 'bg-emerald-100 text-emerald-700',
  info:    'bg-blue-100 text-blue-700',
};

const Navbar = ({ abrirSidebar }) => {
  const { user, signOut } = useAuth();
  const { companyId } = useCompanyId();
  const navigate = useNavigate();
  const location = useLocation();

  const [painelAberto, setPainelAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [lidas, setLidas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_lidas') || '[]'); } catch { return []; }
  });
  const [carregando, setCarregando] = useState(false);
  const painelRef = useRef(null);

  const titulo = TITULOS[location.pathname] || 'Visão Geral';
  const naoLidas = notificacoes.filter(n => !lidas.includes(n.id));

  // Carrega notificações ao montar e a cada 5 minutos
  useEffect(() => {
    if (!companyId) return;
    const carregar = async () => {
      setCarregando(true);
      try {
        const dados = await notificacaoService.obterTodas(companyId);
        setNotificacoes(dados);
      } catch {/* ignore */}
      finally { setCarregando(false); }
    };
    carregar();
    const intervalo = setInterval(carregar, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, [companyId]);

  // Recarrega ao mudar de rota
  useEffect(() => {
    if (!companyId) return;
    notificacaoService.obterTodas(companyId).then(setNotificacoes).catch(() => {});
  }, [location.pathname, companyId]);

  // Fecha painel ao clicar fora
  useEffect(() => {
    const handleClick = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target)) {
        setPainelAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const marcarTodasLidas = () => {
    const ids = notificacoes.map(n => n.id);
    setLidas(ids);
    localStorage.setItem('notif_lidas', JSON.stringify(ids));
  };

  const marcarLida = (id) => {
    const novas = [...new Set([...lidas, id])];
    setLidas(novas);
    localStorage.setItem('notif_lidas', JSON.stringify(novas));
  };

  const handleClicarNotificacao = (notif) => {
    marcarLida(notif.id);
    setPainelAberto(false);
    navigate(notif.link);
  };

  const handleLogout = () => { signOut(); navigate('/login'); };

  return (
    <header
      className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 left-0 lg:left-64 z-20 transition-all duration-300"
      role="banner"
    >
      {/* Esquerda */}
      <div className="flex items-center gap-3">
        <button onClick={abrirSidebar} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl" aria-label="Abrir menu">
          <FiMenu size={22} />
        </button>
        <h2 className="text-base font-semibold text-gray-700">{titulo}</h2>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-1.5">

        {/* ── Sino de Notificações ── */}
        <div className="relative" ref={painelRef}>
          <button
            onClick={() => setPainelAberto(!painelAberto)}
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Notificações"
          >
            <FiBell size={19} />
            {/* Badge vermelho com contagem */}
            {naoLidas.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {naoLidas.length > 9 ? '9+' : naoLidas.length}
              </span>
            )}
          </button>

          {/* ── Painel dropdown ── */}
          {painelAberto && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

              {/* Header do painel */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <FiBell size={15} className="text-gray-500" />
                  <span className="font-bold text-sm text-gray-700">Notificações</span>
                  {naoLidas.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                      {naoLidas.length} nova{naoLidas.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {naoLidas.length > 0 && (
                    <button onClick={marcarTodasLidas} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                      Marcar todas lidas
                    </button>
                  )}
                  <button onClick={() => setPainelAberto(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <FiX size={14} />
                  </button>
                </div>
              </div>

              {/* Lista de notificações */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {carregando ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto" />
                    <p className="text-xs text-gray-400 mt-2">A carregar...</p>
                  </div>
                ) : notificacoes.length === 0 ? (
                  <div className="py-10 text-center">
                    <FiCheckCircle size={32} className="text-emerald-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-400">Tudo em ordem!</p>
                    <p className="text-xs text-gray-300 mt-1">Sem notificações pendentes</p>
                  </div>
                ) : (
                  notificacoes.map((notif) => {
                    const isLida = lidas.includes(notif.id);
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleClicarNotificacao(notif)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!isLida ? 'bg-blue-50/30' : ''}`}
                      >
                        <IconeNotificacao icone={notif.icone} tipo={notif.tipo} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-700">{notif.titulo}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${BADGE[notif.tipo] || BADGE.info}`}>
                              {notif.tipo}
                            </span>
                            {!isLida && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.mensagem}</p>
                        </div>
                        <FiChevronRight size={13} className="text-gray-300 flex-shrink-0 mt-1" />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notificacoes.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                  <p className="text-xs text-gray-400">{notificacoes.length} notificação{notificacoes.length > 1 ? 'ões' : ''} no total</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Perfil */}
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label={`Perfil de ${user?.nome || 'Utilizador'}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.nome ? user.nome.charAt(0).toUpperCase() : <FiUser size={14} />}
          </div>
          <span className="font-medium text-gray-700 text-sm hidden md:block">{user?.nome || 'Utilizador'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          aria-label="Terminar sessão"
          title="Sair"
        >
          <FiLogOut size={19} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;