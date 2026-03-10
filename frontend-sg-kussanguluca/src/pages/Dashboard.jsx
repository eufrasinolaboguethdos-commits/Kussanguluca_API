import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCompanyId } from '../hooks/useCompanyId';

import { receitaService } from '../services/receitaService';
import { despesaService } from '../services/despesaService';

import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar
} from 'react-icons/fi';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

/* ====================== Helpers (mantendo teu estilo de formatação) ====================== */

const PT_MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const toNumber = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

const formatarValor = (valor) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(toNumber(valor));

const formatarData = (dataString) => new Date(dataString).toLocaleDateString('pt-PT');

/** Gera últimos N meses { chave: '2026-03', label: 'Mar' } */
function ultimosMeses(n = 6) {
  const out = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    out.push({
      chave: `${yyyy}-${mm}`,
      label: PT_MESES_CURTOS[d.getMonth()],
    });
  }
  return out;
}

/** Agrega receitas e despesas por mês para o BarChart (sem números aleatórios) */
function agregacaoMensal(receitas = [], despesas = [], nMeses = 6) {
  const meses = ultimosMeses(nMeses);
  const mapa = new Map(meses.map(m => [m.chave, { mes: m.label, receitas: 0, despesas: 0 }]));

  // receitas
  for (const r of receitas) {
    const d = new Date(r.data);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (mapa.has(chave)) {
      const acc = mapa.get(chave);
      acc.receitas += toNumber(r.valor);
    }
  }
  // despesas
  for (const d of despesas) {
    const dt = new Date(d.data);
    const chave = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (mapa.has(chave)) {
      const acc = mapa.get(chave);
      acc.despesas += toNumber(d.valor);
    }
  }

  return Array.from(mapa.values());
}

/* ====================== Componente (mesmo visual) ====================== */

const Dashboard = () => {
  // mantém teu contexto e saudação
  const { user } = useAuth();
  const navigate = useNavigate();

  // usa a empresa ativa de forma consistente
  const { companyId,  activeCompany, loadingCompany } = useCompanyId();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    transacoesRecentes: [],
  });

  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState([]);

  // Redireciono só quando terminar de hidratar e não houver empresa
  useEffect(() => {
    if (!loadingCompany && !companyId) {
      navigate('/company-selector', {
        state: { message: 'Por favor, selecione ou crie uma empresa para continuar.' },
      });
    }
  }, [loadingCompany, companyId, navigate]);

  // Carregamento de dados quando a empresa estiver pronta
  useEffect(() => {
    async function carregarDados() {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // *** IMPORTANTE: passar SEMPRE o companyId ***
        const [receitas, despesas] = await Promise.all([
          receitaService.getAll(companyId),
          despesaService.getAll(companyId),
        ]);

        const totalRec = (receitas || []).reduce((sum, r) => sum + toNumber(r.valor), 0);
        const totalDesp = (despesas || []).reduce((sum, d) => sum + toNumber(d.valor), 0);

        const transacoesRecentes = [...(receitas || []), ...(despesas || [])]
          .sort((a, b) => new Date(b.data) - new Date(a.data))
          .slice(0, 5);

        setStats({
          totalReceitas: totalRec,
          totalDespesas: totalDesp,
          saldo: totalRec - totalDesp,
          transacoesRecentes,
        });

        // Pizza: mesma estrutura e cores que já usavas
        setDadosGrafico([
          { name: 'Receitas', value: totalRec, color: '#10b981' },
          { name: 'Despesas', value: totalDesp, color: '#ef4444' },
        ]);

        // Barras: agora com base real (sem Math.random)
        setEvolucaoMensal(agregacaoMensal(receitas, despesas, 6));
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        setStats({
          totalReceitas: 0,
          totalDespesas: 0,
          saldo: 0,
          transacoesRecentes: [],
        });
        setDadosGrafico([
          { name: 'Receitas', value: 0, color: '#10b981' },
          { name: 'Despesas', value: 0, color: '#ef4444' },
        ]);
        setEvolucaoMensal([]);
      } finally {
        setLoading(false);
      }
    }

    if (!loadingCompany) carregarDados();
  }, [companyId, loadingCompany]);

  // Tela de “preparar ambiente” enquanto o hook hidrata a empresa
  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">A preparar o ambiente da empresa...</p>
        </div>
      </div>
    );
  }

  // Loader original
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  /* ====================== UI (MANTIDO) ====================== */

  return (
      <div className="space-y-6">
      {/* Header - ATUALIZAR COM NOME DA EMPRESA */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {user?.nome || 'Utilizador'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Empresa: <span className="font-semibold text-brand-600">{activeCompany?.nome}</span>
        </p>
      </div>

      {/* Cards - EXATAMENTE IGUAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Receitas</p>
              <p className="text-lg md:text-2xl font-bold text-green-600 mt-1">
                {formatarValor(stats.totalReceitas)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">+12% este mês</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Despesas</p>
              <p className="text-lg md:text-2xl font-bold text-red-600 mt-1">
                {formatarValor(stats.totalDespesas)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiTrendingDown className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">+5% este mês</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Líquido</p>
              <p className={`text-lg md:text-2xl font-bold mt-1 ${stats.saldo >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
                {formatarValor(stats.saldo)}
              </p>
            </div>
            <div className="p-3 bg-brand-100 rounded-full">
              <FiDollarSign className="text-brand-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.saldo >= 0 ? 'Situação positiva' : 'Atenção ao défice'}
          </p>
        </div>
      </div>

      {/* Gráficos - EXATAMENTE IGUAL (apenas os dados vieram da agregação real) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição Financeira</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGrafico}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dadosGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarValor(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucaoMensal} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="mes" />
                <YAxis 
                   width={70}
                   tickFormatter={(value) => {
                   if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                   if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                   return value;
                   }}
                />
                <Tooltip formatter={(value) => formatarValor(value)} />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transações - EXATAMENTE IGUAL */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transações Recentes</h3>
          <button onClick={() => navigate('/receitas')} className="text-brand-500 hover:text-brand-700 text-sm font-medium">
            Ver todas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Descrição</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 hidden md:table-cell">Data</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Valor</th>
              </tr>
            </thead>
            <tbody>
              {stats.transacoesRecentes.map((transacao, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 hidden sm:table-cell text-sm text-gray-800">{transacao.descricao}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transacao.valor > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transacao.valor > 0 ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <FiCalendar size={14} />
                      {formatarData(transacao.data)}
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-sm font-medium text-right ${
                    transacao.valor > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarValor(Math.abs(transacao.valor))}
                  </td>
                </tr>
              ))}
              {stats.transacoesRecentes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Sem transações para exibir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;