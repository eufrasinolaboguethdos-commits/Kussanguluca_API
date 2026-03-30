import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCompanyId } from '../hooks/useCompanyId';

import { receitaService } from '../services/receitaService';
import { despesaService } from '../services/despesaService';
import { saudeService } from '../services/saudeService';
import { metaService } from '../services/metaService';
import { contaService } from '../services/contaService';

import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar,
  FiShield, FiTarget, FiCreditCard, FiArrowRight,
  FiAlertTriangle, FiCheckCircle
} from 'react-icons/fi';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

/* ── Helpers ── */
const PT_MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const toNumber = (x) => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const formatarValor = (valor) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(toNumber(valor));
const formatarData = (dataString) => new Date(dataString).toLocaleDateString('pt-PT');

function ultimosMeses(n = 6) {
  const out = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({ chave: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: PT_MESES_CURTOS[d.getMonth()] });
  }
  return out;
}

function agregacaoMensal(receitas = [], despesas = [], nMeses = 6) {
  const meses = ultimosMeses(nMeses);
  const mapa = new Map(meses.map(m => [m.chave, { mes: m.label, receitas: 0, despesas: 0 }]));
  for (const r of receitas) {
    const d = new Date(r.data);
    const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (mapa.has(chave)) mapa.get(chave).receitas += toNumber(r.valor);
  }
  for (const d of despesas) {
    const dt = new Date(d.data);
    const chave = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    if (mapa.has(chave)) mapa.get(chave).despesas += toNumber(d.valor);
  }
  return Array.from(mapa.values());
}

const BarraProgresso = ({ valor, cor }) => (
  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
    <div className={`h-2 rounded-full transition-all duration-500 ${cor}`} style={{ width: `${Math.min(valor, 100)}%` }} />
  </div>
);

/* ── Dashboard ── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { companyId, activeCompany, loadingCompany } = useCompanyId();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalReceitas: 0, totalDespesas: 0, saldo: 0, transacoesRecentes: [] });
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState([]);
  const [saude, setSaude] = useState(null);
  const [meta, setMeta] = useState(null);
  const [resumoContas, setResumoContas] = useState(null);

  useEffect(() => {
    if (!loadingCompany && !companyId) {
      navigate('/company-selector', { state: { message: 'Por favor, selecione ou crie uma empresa para continuar.' } });
    }
  }, [loadingCompany, companyId, navigate]);

  useEffect(() => {
    async function carregarDados() {
      if (!companyId) { setLoading(false); return; }
      try {
        setLoading(true);
        const [receitas, despesas, saudeDados, metaDados, contasDados] = await Promise.all([
          receitaService.getAll(companyId),
          despesaService.getAll(companyId),
          saudeService.obter(companyId).catch(() => null),
          metaService.actual(companyId).catch(() => null),
          contaService.resumo(companyId).catch(() => null),
        ]);

        const totalRec  = (receitas || []).reduce((s, r) => s + toNumber(r.valor), 0);
        const totalDesp = (despesas || []).reduce((s, d) => s + toNumber(d.valor), 0);
        const transacoesRecentes = [
          ...(receitas || []).map(r => ({ ...r, tipo: 'receita' })),
          ...(despesas || []).map(d => ({ ...d, tipo: 'despesa' })),
        ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

        setStats({ totalReceitas: totalRec, totalDespesas: totalDesp, saldo: totalRec - totalDesp, transacoesRecentes });
        setDadosGrafico([
          { name: 'Receitas', value: totalRec,  color: '#10b981' },
          { name: 'Despesas', value: totalDesp, color: '#f43f5e' },
        ]);
        setEvolucaoMensal(agregacaoMensal(receitas, despesas, 6));
        setSaude(saudeDados);
        setMeta(metaDados);
        setResumoContas(contasDados);
      } catch (error) {
        console.error('Erro dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    if (!loadingCompany) carregarDados();
  }, [companyId, loadingCompany]);

  if (loadingCompany) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
        <p className="mt-4 text-gray-500 text-sm">A preparar o ambiente da empresa...</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
    </div>
  );

  const nivelBg    = { verde: 'from-emerald-500 to-teal-600', amarelo: 'from-amber-500 to-orange-500', vermelho: 'from-rose-500 to-pink-600' };
  const nivelLabel = { verde: '🟢 Saudável', amarelo: '🟡 Atenção', vermelho: '🔴 Crítico' };
  const nivelBarra = { verde: 'bg-emerald-500', amarelo: 'bg-amber-500', vermelho: 'bg-rose-500' };
  const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 shadow-xl">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-brand-500 opacity-10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Painel Principal</p>
        <h1 className="text-2xl font-bold text-white">Olá, {user?.nome || 'Utilizador'}! 👋</h1>
        <p className="mt-1 text-slate-300 text-sm">
          Empresa activa: <span className="font-semibold text-emerald-400">{activeCompany?.nome || '—'}</span>
        </p>
      </div>

      {/* Cards financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Total Receitas</p>
              <p className="text-2xl font-extrabold mt-1">{formatarValor(stats.totalReceitas)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl"><FiTrendingUp size={22} /></div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs font-semibold uppercase tracking-wide">Total Despesas</p>
              <p className="text-2xl font-extrabold mt-1">{formatarValor(stats.totalDespesas)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl"><FiTrendingDown size={22} /></div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Saldo Líquido</p>
              <p className={`text-2xl font-extrabold mt-1 ${stats.saldo < 0 ? 'text-rose-300' : 'text-white'}`}>
                {formatarValor(stats.saldo)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl"><FiDollarSign size={22} /></div>
          </div>
          <p className="text-blue-100 text-xs mt-2">{stats.saldo >= 0 ? '✓ Situação positiva' : '⚠ Atenção ao défice'}</p>
        </div>
      </div>

      {/* Widgets da Plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Saúde Financeira */}
        <div onClick={() => navigate('/saude')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-50 rounded-xl"><FiShield className="text-brand-500" size={16} /></div>
              <span className="text-sm font-bold text-gray-700">Saúde Financeira</span>
            </div>
            <FiArrowRight className="text-gray-300" size={16} />
          </div>
          {saude ? (
            <>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${nivelBg[saude.nivel] || nivelBg.verde} mb-3`}>
                {nivelLabel[saude.nivel] || '🟢 Saudável'}
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Pontuação</span>
                <span className="text-lg font-extrabold text-gray-800">{saude.pontuacao}<span className="text-xs text-gray-400">/100</span></span>
              </div>
              <BarraProgresso valor={saude.pontuacao} cor={nivelBarra[saude.nivel] || 'bg-emerald-500'} />
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Clica para calcular</p>
          )}
        </div>

        {/* Meta do Mês */}
        <div onClick={() => navigate('/metas')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-xl"><FiTarget className="text-purple-500" size={16} /></div>
              <span className="text-sm font-bold text-gray-700">Meta do Mês</span>
            </div>
            <FiArrowRight className="text-gray-300" size={16} />
          </div>
          {meta?.existe ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Receita</span>
                <span className="text-xs font-semibold text-gray-600">{meta.progressoReceita?.toFixed(0)}%</span>
              </div>
              <BarraProgresso valor={meta.progressoReceita || 0} cor={meta.progressoReceita >= 100 ? 'bg-emerald-500' : 'bg-brand-500'} />
              <div className="flex items-center justify-between mt-2 mb-1">
                <span className="text-xs text-gray-400">Despesa</span>
                <span className="text-xs font-semibold text-gray-600">{meta.progressoDespesa?.toFixed(0)}%</span>
              </div>
              <BarraProgresso valor={meta.progressoDespesa || 0} cor={meta.progressoDespesa >= 100 ? 'bg-rose-500' : meta.progressoDespesa >= 90 ? 'bg-amber-500' : 'bg-emerald-500'} />
              {meta.alertaDespesa && <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs font-semibold"><FiAlertTriangle size={11} /> Próximo do limite!</div>}
              {meta.metaReceitaAtingida && <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-semibold"><FiCheckCircle size={11} /> Meta atingida! 🎉</div>}
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Sem meta definida para este mês</p>
          )}
        </div>

        {/* Contas Pendentes */}
        <div onClick={() => navigate('/contas')} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-xl"><FiCreditCard className="text-orange-500" size={16} /></div>
              <span className="text-sm font-bold text-gray-700">Contas</span>
            </div>
            <FiArrowRight className="text-gray-300" size={16} />
          </div>
          {resumoContas ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                <span className="text-xs text-emerald-700 font-medium">A Receber</span>
                <span className="text-xs font-bold text-emerald-700">{formatarValor(resumoContas.total_receber)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                <span className="text-xs text-rose-700 font-medium">A Pagar</span>
                <span className="text-xs font-bold text-rose-700">{formatarValor(resumoContas.total_pagar)}</span>
              </div>
              {resumoContas.total_vencido > 0 && (
                <div className="flex items-center gap-1 text-rose-600 text-xs font-semibold">
                  <FiAlertTriangle size={11} /> {formatarValor(resumoContas.total_vencido)} em atraso
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Clica para gerir contas</p>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribuição Financeira */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">Distribuição Financeira</h3>
          <div className="h-56 min-h-[224px]">
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie
                  data={dadosGrafico}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dadosGrafico.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatarValor(v)} contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolução Mensal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">Evolução Mensal</h3>
          <div className="h-56 min-h-[224px]">
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={evolucaoMensal} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={60}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                />
                <Tooltip formatter={(v) => formatarValor(v)} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" radius={[4,4,0,0]} />
                <Bar dataKey="despesas" fill="#f43f5e" name="Despesas" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">Transações Recentes</h3>
          <button onClick={() => navigate('/Transacoes')} className="text-xs font-semibold text-brand-500 hover:text-brand-700 px-3 py-1 rounded-lg hover:bg-brand-50 transition-colors">
            Ver todas →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Descrição</th>
                <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Tipo</th>
                <th className="text-left pb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Data</th>
                <th className="text-right pb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
              </tr>
            </thead>
            <tbody>
              {stats.transacoesRecentes.map((t, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-2 hidden sm:table-cell text-sm font-medium text-gray-700">{t.descricao}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${t.tipo === 'receita' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {t.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-400 hidden md:table-cell">
                    <div className="flex items-center gap-1.5"><FiCalendar size={12} />{formatarData(t.data)}</div>
                  </td>
                  <td className={`py-3 px-2 text-sm font-bold text-right ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatarValor(Math.abs(t.valor))}
                  </td>
                </tr>
              ))}
              {stats.transacoesRecentes.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-gray-400 text-sm">Sem transações para exibir.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;