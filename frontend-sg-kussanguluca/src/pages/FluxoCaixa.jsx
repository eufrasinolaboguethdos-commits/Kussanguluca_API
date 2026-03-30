import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../hooks/useCompanyId';
import { fluxoService } from '../services/fluxoService';
import {
  FiActivity, FiAlertTriangle, FiTrendingUp,
  FiTrendingDown, FiDollarSign
} from 'react-icons/fi';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const formatarValor = (v) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);

const formatarValorCurto = (v) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v;
};

const FluxoCaixa = () => {
  const { companyId, loadingCompany } = useCompanyId();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if (loadingCompany) return;
  
  if (!companyId) {
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }

  fluxoService.obter(companyId)
    .then(setDados)
    .catch(console.error)
    .finally(() => setLoading(false));
}, [companyId, loadingCompany]);

  if (loadingCompany || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-brand-500 mx-auto"></div>
      </div>
    );
  }
  if (!companyId && !loadingCompany) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-gray-400 font-semibold">Nenhuma empresa seleccionada</p>
        <p className="text-gray-300 text-sm mt-1">Selecciona ou cria uma empresa para ver este conteúdo</p>
      </div>
    </div>
  );
}

  // Combina fluxo real com projecção
  const dadosReaisComTipo = (dados?.fluxoReal || []).map(d => ({ ...d, tipo: 'real' }));
  const projecaoComTipo = (dados?.projecao || []).map(d => ({
    mes: d.mes,
    receitas: d.receita_prevista,
    despesas: d.despesa_prevista,
    saldo: d.saldo_previsto,
    tipo: 'projectado'
  }));

  const dadosGrafico = [...dadosReaisComTipo, ...projecaoComTipo];

  const tooltipStyle = {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  };

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="p-2 bg-brand-50 rounded-xl"><FiActivity className="text-brand-500" size={18} /></span>
          Fluxo de Caixa
        </h1>
        <p className="text-gray-400 text-sm mt-1 ml-10">Histórico real e projecção dos próximos 3 meses</p>
      </div>

      {/* Alerta de projecção negativa */}
      {dados?.alertaNegativo && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-rose-100 rounded-xl flex-shrink-0">
            <FiAlertTriangle className="text-rose-500" size={18} />
          </div>
          <div>
            <p className="font-semibold text-rose-800 text-sm">Alerta de Fluxo Negativo</p>
            <p className="text-xs text-rose-600 mt-0.5">
              A projecção indica saldo negativo nos próximos meses. Considere aumentar as receitas ou reduzir despesas.
            </p>
          </div>
        </div>
      )}

      {/* Cards de médias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Média Receita/Mês</p>
              <p className="text-xl font-extrabold mt-1">{formatarValor(dados?.mediaReceita)}</p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl"><FiTrendingUp size={20} /></div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs font-semibold uppercase tracking-wide">Média Despesa/Mês</p>
              <p className="text-xl font-extrabold mt-1">{formatarValor(dados?.mediaDespesa)}</p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl"><FiTrendingDown size={20} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Saldo Médio Previsto</p>
              <p className={`text-xl font-extrabold mt-1 ${
                (dados?.mediaReceita - dados?.mediaDespesa) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatarValor((dados?.mediaReceita || 0) - (dados?.mediaDespesa || 0))}
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-xl"><FiDollarSign className="text-purple-500" size={20} /></div>
          </div>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
            Evolução Real + Projecção
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Real
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-300 inline-block"></span> Projectado
            </span>
          </div>
        </div>

        {dadosGrafico.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <FiActivity size={40} className="mx-auto mb-2" />
              <p className="text-sm">Sem dados suficientes para projecção</p>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dadosGrafico} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.substring(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatarValorCurto}
                  width={60}
                />
                <Tooltip
                  formatter={(v, name) => [formatarValor(v), name]}
                  contentStyle={tooltipStyle}
                  labelFormatter={(l) => `Mês: ${l}`}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                  strokeDasharray="5 5"/*{(d) => d?.tipo === 'projectado' ? '5 5' : '0'}*/
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela de projecção */}
      {dados?.projecao?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-blue-50">
            <h3 className="text-sm font-bold text-brand-800 flex items-center gap-2">
              <FiActivity size={14} /> Projecção dos Próximos 3 Meses
            </h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="w-full min-w-[400px]">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Mês</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Receita Prev.</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Despesa Prev.</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Saldo Prev.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dados.projecao.map((p, i) => (
                <tr key={i} className="hover:bg-brand-50/20 transition-colors">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700">{p.mes}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-emerald-600">
                    {formatarValor(p.receita_prevista)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-rose-600">
                    {formatarValor(p.despesa_prevista)}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-bold ${p.saldo_previsto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatarValor(p.saldo_previsto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FluxoCaixa;