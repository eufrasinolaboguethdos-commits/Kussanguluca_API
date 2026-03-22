import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  FiFileText, FiDownload, FiCalendar, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiPieChart, FiBarChart2, FiPrinter, FiFilter,
  FiChevronDown, FiChevronUp, FiAlertCircle
} from 'react-icons/fi';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const Relatorio = () => {
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);
  const [tipoVisualizacao, setTipoVisualizacao] = useState('geral');
  
  const { register, handleSubmit, watch, /*formState: { errors }*/ } = useForm({
    defaultValues: {
      dataInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      dataFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      tipoRelatorio: 'completo'
    }
  });

  const dataInicio = watch('dataInicio');
  const dataFim = watch('dataFim');

  const gerarRelatorio = async (filtros) => {
    try {
      setLoading(true);
      const id_empresa = localStorage.getItem('activeCompanyId');
      const response = await api.get('/relatorio', {
        params: { dataInicio: filtros.dataInicio, dataFim: filtros.dataFim, id_empresa }
      });
      setRelatorio(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSubmit(gerarRelatorio)(); }, []);
  const onSubmit = (data) => { gerarRelatorio(data); };

  const exportarExcel = async () => {
    if (!relatorio) return;
    try {
      const id_empresa = localStorage.getItem('activeCompanyId');
      const response = await api.get('/exportar/excel', { params: { id_empresa, dataInicio, dataFim }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${dataInicio}_${dataFim}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Erro ao exportar Excel:', err); alert('Erro ao exportar Excel. Tente novamente.'); }
  };

  const exportarPDF = async () => {
    if (!relatorio) return;
    try {
      const id_empresa = localStorage.getItem('activeCompanyId');
      const response = await api.get('/exportar/pdf', { params: { id_empresa, dataInicio, dataFim }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${dataInicio}_${dataFim}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Erro ao exportar PDF:', err); alert('Erro ao exportar PDF. Tente novamente.'); }
  };

  const formatarValor = (valor) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valor || 0);

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try { return format(parseISO(dataString), 'dd/MM/yyyy', { locale: pt }); }
    catch { return dataString; }
  };

  const formatarMes = (dataString) => {
    try { return format(parseISO(dataString), 'MMM/yyyy', { locale: pt }); }
    catch { return dataString; }
  };

  const dadosGraficoPizza = relatorio ? [
    { name: 'Receitas', value: parseFloat(relatorio.totalReceitas) || 0, color: '#10b981' },
    { name: 'Despesas', value: parseFloat(relatorio.totalDespesas) || 0, color: '#f43f5e' }
  ] : [];

  const agruparPorCategoria = (itens) => {
    const grupos = {};
    itens?.forEach(item => { const cat = item.categoria || 'Sem Categoria'; grupos[cat] = (grupos[cat] || 0) + parseFloat(item.valor || 0); });
    return Object.entries(grupos).map(([name, value]) => ({ name, value }));
  };

  const dadosCategoriasReceitas = relatorio ? agruparPorCategoria(relatorio.receitas) : [];
  const dadosCategoriasDespesas = relatorio ? agruparPorCategoria(relatorio.despesas) : [];

  const agruparPorMes = (itens) => {
    const grupos = {};
    itens?.forEach(item => { const mes = formatarMes(item.data); grupos[mes] = (grupos[mes] || 0) + parseFloat(item.valor || 0); });
    return Object.entries(grupos).map(([mes, valor]) => ({ mes, valor }));
  };

  const dadosEvolucao = relatorio
    ? { receitas: agruparPorMes(relatorio.receitas), despesas: agruparPorMes(relatorio.despesas) }
    : { receitas: [], despesas: [] };

  const calcularIndicadores = () => {
    if (!relatorio) return null;
    const totalRec = parseFloat(relatorio.totalReceitas) || 0;
    const totalDesp = parseFloat(relatorio.totalDespesas) || 0;
    const saldo = totalRec - totalDesp;
    return {
      margemLucro: totalRec > 0 ? ((saldo / totalRec) * 100).toFixed(1) : 0,
      razaoDespesa: totalRec > 0 ? ((totalDesp / totalRec) * 100).toFixed(1) : 0,
      mediaReceitaDiaria: totalRec / 30,
      mediaDespesaDiaria: totalDesp / 30
    };
  };

  const indicadores = calcularIndicadores();
  const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-brand-50 rounded-xl"><FiFileText className="text-brand-500" size={18} /></span>
            Relatórios Financeiros
          </h1>
          <p className="text-gray-400 text-sm mt-1 ml-10">Análise completa das receitas e despesas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportarExcel} disabled={!relatorio}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm">
            <FiDownload size={16} /><span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={exportarPDF} disabled={!relatorio}
            className="flex items-center gap-2 px-4 py-2.5 text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl hover:from-rose-600 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-md shadow-rose-200">
            <FiPrinter size={16} /><span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <FiFilter className="text-brand-500" size={18} />
            <span className="font-semibold text-gray-700 text-sm">Filtros do Relatório</span>
          </div>
          {filtrosVisiveis ? <FiChevronUp size={18} className="text-gray-400" /> : <FiChevronDown size={18} className="text-gray-400" />}
        </button>
        {filtrosVisiveis && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Data Início</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
                  <input type="date" {...register('dataInicio', { required: true })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Data Fim</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
                  <input type="date" {...register('dataFim', { required: true })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Tipo de Relatório</label>
                <select {...register('tipoRelatorio')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 bg-white text-sm">
                  <option value="completo">Completo</option>
                  <option value="receitas">Apenas Receitas</option>
                  <option value="despesas">Apenas Despesas</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" isLoading={loading} className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md">
                  <FiBarChart2 size={16} /> Gerar Relatório
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-400 text-sm">Gerando relatório...</p>
          </div>
        </div>
      ) : relatorio ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
              <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-5" />
              <div className="flex items-center justify-between">
                <div><p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Total Receitas</p><p className="text-xl font-extrabold mt-1">{formatarValor(relatorio.totalReceitas)}</p></div>
                <div className="p-2.5 bg-white/20 rounded-xl"><FiTrendingUp size={20} /></div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg">
              <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-5" />
              <div className="flex items-center justify-between">
                <div><p className="text-rose-100 text-xs font-semibold uppercase tracking-wide">Total Despesas</p><p className="text-xl font-extrabold mt-1">{formatarValor(relatorio.totalDespesas)}</p></div>
                <div className="p-2.5 bg-white/20 rounded-xl"><FiTrendingDown size={20} /></div>
              </div>
            </div>
            <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${(relatorio.totalReceitas - relatorio.totalDespesas) >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
              <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white opacity-5" />
              <div className="flex items-center justify-between">
                <div><p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Saldo</p><p className="text-xl font-extrabold mt-1">{formatarValor(relatorio.totalReceitas - relatorio.totalDespesas)}</p></div>
                <div className="p-2.5 bg-white/20 rounded-xl"><FiDollarSign size={20} /></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Margem</p><p className={`text-2xl font-extrabold mt-1 ${indicadores?.margemLucro >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{indicadores?.margemLucro}%</p></div>
                <div className="p-2.5 bg-purple-50 rounded-xl"><FiPieChart className="text-purple-500" size={20} /></div>
              </div>
            </div>
          </div>

          {indicadores && indicadores.razaoDespesa > 80 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-xl flex-shrink-0"><FiAlertCircle className="text-orange-500" size={18} /></div>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Atenção à saúde financeira</p>
                <p className="text-xs text-orange-600 mt-0.5">As suas despesas representam {indicadores.razaoDespesa}% das receitas.</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-100">
              <nav className="flex gap-1 px-4 pt-2">
                {[{ id: 'geral', label: 'Visão Geral', icon: FiPieChart }, { id: 'categoria', label: 'Por Categoria', icon: FiBarChart2 }, { id: 'evolucao', label: 'Evolução', icon: FiTrendingUp }].map((tab) => (
                  <button key={tab.id} onClick={() => setTipoVisualizacao(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 ${tipoVisualizacao === tab.id ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                    <tab.icon size={14} />{tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {tipoVisualizacao === 'geral' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Distribuição Receitas vs Despesas</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dadosGraficoPizza} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {dadosGraficoPizza.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value) => formatarValor(value)} contentStyle={tooltipStyle} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Indicadores Financeiros</h3>
                    {[
                      { label: 'Razão Despesa/Receita', value: `${indicadores?.razaoDespesa}%`, alert: indicadores?.razaoDespesa > 80 },
                      { label: 'Média Receita Diária', value: formatarValor(indicadores?.mediaReceitaDiaria) },
                      { label: 'Média Despesa Diária', value: formatarValor(indicadores?.mediaDespesaDiaria) },
                      { label: 'Total de Transações', value: (relatorio.receitas?.length || 0) + (relatorio.despesas?.length || 0) },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className={`text-sm font-bold ${item.alert ? 'text-rose-600' : 'text-gray-800'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tipoVisualizacao === 'categoria' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-600 mb-4">Receitas por Categoria</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosCategoriasReceitas} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" tickFormatter={(val) => formatarValor(val)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(val) => formatarValor(val)} contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-rose-600 mb-4">Despesas por Categoria</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosCategoriasDespesas} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis type="number" tickFormatter={(val) => formatarValor(val)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(val) => formatarValor(val)} contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {tipoVisualizacao === 'evolucao' && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Evolução Mensal</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosEvolucao.receitas.map((r, i) => ({ mes: r.mes, receitas: r.valor, despesas: dadosEvolucao.despesas[i]?.valor || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => formatarValor(val)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(val) => formatarValor(val)} contentStyle={tooltipStyle} />
                        <Legend />
                        <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} name="Receitas" />
                        <Line type="monotone" dataKey="despesas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5, fill: '#f43f5e' }} name="Despesas" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-2"><FiTrendingUp size={14} /> Receitas Detalhadas ({relatorio.receitas?.length || 0})</h3>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Descrição</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {relatorio.receitas?.map((receita, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-400">{formatarData(receita.data)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">{receita.descricao}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-emerald-600">{formatarValor(receita.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
                <h3 className="font-bold text-rose-800 text-sm flex items-center gap-2"><FiTrendingDown size={14} /> Despesas Detalhadas ({relatorio.despesas?.length || 0})</h3>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Descrição</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {relatorio.despesas?.map((despesa, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-400">{formatarData(despesa.data)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">{despesa.descricao}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-rose-600">{formatarValor(despesa.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 bg-gray-50 rounded-2xl inline-block mb-4"><FiFileText className="text-gray-300" size={48} /></div>
          <p className="text-gray-500 font-semibold">Nenhum relatório gerado</p>
          <p className="text-gray-400 text-sm mt-1">Selecione um período e clique em "Gerar Relatório"</p>
        </div>
      )}
    </div>
  );
};

export default Relatorio;