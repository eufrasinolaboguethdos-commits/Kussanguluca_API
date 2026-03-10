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
  const [tipoVisualizacao, setTipoVisualizacao] = useState('geral'); // 'geral', 'mensal', 'categoria'
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      dataInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      dataFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      tipoRelatorio: 'completo'
    }
  });

  const dataInicio = watch('dataInicio');
  const dataFim = watch('dataFim');

  // Buscar relatório da API
 const gerarRelatorio = async (filtros) => {
    try {
      setLoading(true);
      const id_empresa = localStorage.getItem('activeCompanyId'); // ✅ pega do localStorage
      const response = await api.get('/relatorio', {
        params: {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          id_empresa  // ✅ envia na query
        }
      });
      
      setRelatorio(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Gerar relatório inicial ao carregar
  useEffect(() => {
    handleSubmit(gerarRelatorio)();
  }, []);

  const onSubmit = (data) => {
    gerarRelatorio(data);
  };

  // Exportar para PDF (simulado)
  const exportarPDF = () => {
    window.print();
  };

  // Exportar para Excel/CSV
  const exportarCSV = () => {
    if (!relatorio) return;
    
    const csvContent = [
      ['Relatório Financeiro - SG Kussanguluca'],
      [`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`],
      [],
      ['Resumo'],
      ['Total Receitas', relatorio.totalReceitas],
      ['Total Despesas', relatorio.totalDespesas],
      ['Saldo', relatorio.saldo],
      [],
      ['Receitas Detalhadas'],
      ['Data', 'Descrição', 'Categoria', 'Valor'],
      ...relatorio.receitas.map(r => [r.data, r.descricao, r.categoria, r.valor]),
      [],
      ['Despesas Detalhadas'],
      ['Data', 'Descrição', 'Categoria', 'Valor'],
      ...relatorio.despesas.map(d => [d.data, d.descricao, d.categoria, d.valor])
    ].map(row => row.join(';')).join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${dataInicio}_${dataFim}.csv`;
    link.click();
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(valor || 0);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: pt });
    } catch {
      return dataString;
    }
  };

  const formatarMes = (dataString) => {
    try {
      return format(parseISO(dataString), 'MMM/yyyy', { locale: pt });
    } catch {
      return dataString;
    }
  };

  // Preparar dados para gráficos
  const dadosGraficoPizza = relatorio ? [
    { name: 'Receitas', value: parseFloat(relatorio.totalReceitas) || 0, color: '#10b981' },
    { name: 'Despesas', value: parseFloat(relatorio.totalDespesas) || 0, color: '#ef4444' }
  ] : [];

  // Agrupar por categoria
  const agruparPorCategoria = (itens) => {
    const grupos = {};
    itens?.forEach(item => {
      const cat = item.categoria || 'Sem Categoria';
      grupos[cat] = (grupos[cat] || 0) + parseFloat(item.valor || 0);
    });
    return Object.entries(grupos).map(([name, value]) => ({ name, value }));
  };

  const dadosCategoriasReceitas = relatorio ? agruparPorCategoria(relatorio.receitas) : [];
  const dadosCategoriasDespesas = relatorio ? agruparPorCategoria(relatorio.despesas) : [];

  // Agrupar por mês para gráfico de linha
  const agruparPorMes = (itens) => {
    const grupos = {};
    itens?.forEach(item => {
      const mes = formatarMes(item.data);
      grupos[mes] = (grupos[mes] || 0) + parseFloat(item.valor || 0);
    });
    return Object.entries(grupos).map(([mes, valor]) => ({ mes, valor }));
  };

  const dadosEvolucao = relatorio ? {
    receitas: agruparPorMes(relatorio.receitas),
    despesas: agruparPorMes(relatorio.despesas)
  } : { receitas: [], despesas: [] };

  // Calcular indicadores
  const calcularIndicadores = () => {
    if (!relatorio) return null;
    
    const totalRec = parseFloat(relatorio.totalReceitas) || 0;
    const totalDesp = parseFloat(relatorio.totalDespesas) || 0;
    const saldo = totalRec - totalDesp;
    
    return {
      margemLucro: totalRec > 0 ? ((saldo / totalRec) * 100).toFixed(1) : 0,
      razaoDespesa: totalRec > 0 ? ((totalDesp / totalRec) * 100).toFixed(1) : 0,
      mediaReceitaDiaria: totalRec / 30, // Simplificado
      mediaDespesaDiaria: totalDesp / 30
    };
  };

  const indicadores = calcularIndicadores();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiFileText className="text-brand-500" />
            Relatórios Financeiros
          </h1>
          <p className="text-gray-600 mt-1">
            Análise completa das receitas e despesas
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportarCSV}
            disabled={!relatorio}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiDownload size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportarPDF}
            disabled={!relatorio}
            className="flex items-center gap-2 px-4 py-2.5 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiPrinter size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FiFilter className="text-brand-500" size={20} />
            <span className="font-semibold text-gray-800">Filtros do Relatório</span>
          </div>
          {filtrosVisiveis ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </button>
        
        {filtrosVisiveis && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    {...register('dataInicio', { required: 'Data início obrigatória' })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                {errors.dataInicio && (
                  <p className="mt-1 text-sm text-red-600">{errors.dataInicio.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    {...register('dataFim', { required: 'Data fim obrigatória' })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                {errors.dataFim && (
                  <p className="mt-1 text-sm text-red-600">{errors.dataFim.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Relatório
                </label>
                <select
                  {...register('tipoRelatorio')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="completo">Completo</option>
                  <option value="receitas">Apenas Receitas</option>
                  <option value="despesas">Apenas Despesas</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FiBarChart2 size={18} />
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Gerando relatório...</p>
          </div>
        </div>
      ) : relatorio ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Receitas</p>
                  <p className="text-2xl font-bold mt-1">{formatarValor(relatorio.totalReceitas)}</p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FiTrendingUp size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Despesas</p>
                  <p className="text-2xl font-bold mt-1">{formatarValor(relatorio.totalDespesas)}</p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FiTrendingDown size={24} />
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-6 text-white shadow-lg ${
              (relatorio.totalReceitas - relatorio.totalDespesas) >= 0 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Saldo</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatarValor(relatorio.totalReceitas - relatorio.totalDespesas)}
                  </p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <FiDollarSign size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Margem</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    indicadores?.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {indicadores?.margemLucro}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FiPieChart className="text-purple-500" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de saúde financeira */}
          {indicadores && indicadores.razaoDespesa > 80 && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-orange-500 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-orange-800">Atenção à saúde financeira</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Suas despesas representam {indicadores.razaoDespesa}% das receitas. 
                    Considere reduzir gastos ou aumentar receitas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs de Visualização */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex gap-8 px-6">
                {[
                  { id: 'geral', label: 'Visão Geral', icon: FiPieChart },
                  { id: 'categoria', label: 'Por Categoria', icon: FiBarChart2 },
                  { id: 'evolucao', label: 'Evolução', icon: FiTrendingUp }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTipoVisualizacao(tab.id)}
                    className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      tipoVisualizacao === tab.id
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Visão Geral */}
              {tipoVisualizacao === 'geral' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição Receitas vs Despesas</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dadosGraficoPizza}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {dadosGraficoPizza.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatarValor(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Indicadores Financeiros</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Razão Despesa/Receita</span>
                        <span className={`font-bold ${
                          indicadores?.razaoDespesa > 80 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {indicadores?.razaoDespesa}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Média Receita Diária</span>
                        <span className="font-bold text-gray-800">
                          {formatarValor(indicadores?.mediaReceitaDiaria)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Média Despesa Diária</span>
                        <span className="font-bold text-gray-800">
                          {formatarValor(indicadores?.mediaDespesaDiaria)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total de Transações</span>
                        <span className="font-bold text-gray-800">
                          {(relatorio.receitas?.length || 0) + (relatorio.despesas?.length || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Por Categoria */}
              {tipoVisualizacao === 'categoria' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-green-700">Receitas por Categoria</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosCategoriasReceitas} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(val) => formatarValor(val)} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip formatter={(val) => formatarValor(val)} />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-red-700">Despesas por Categoria</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosCategoriasDespesas} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(val) => formatarValor(val)} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip formatter={(val) => formatarValor(val)} />
                          <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Evolução */}
              {tipoVisualizacao === 'evolucao' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução Mensal</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosEvolucao.receitas.map((r, i) => ({
                        mes: r.mes,
                        receitas: r.valor,
                        despesas: dadosEvolucao.despesas[i]?.valor || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis tickFormatter={(val) => formatarValor(val)} />
                        <Tooltip formatter={(val) => formatarValor(val)} />
                        <Legend />
                        <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} name="Receitas" />
                        <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} name="Despesas" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabelas Detalhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela de Receitas */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-green-50">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <FiTrendingUp />
                  Receitas Detalhadas ({relatorio.receitas?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Descrição</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {relatorio.receitas?.map((receita, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{formatarData(receita.data)}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{receita.descricao}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                          {formatarValor(receita.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Despesas */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-red-50">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <FiTrendingDown />
                  Despesas Detalhadas ({relatorio.despesas?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Descrição</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {relatorio.despesas?.map((despesa, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{formatarData(despesa.data)}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{despesa.descricao}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-red-600">
                          {formatarValor(despesa.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiFileText className="mx-auto text-gray-300" size={64} />
          <p className="mt-4 text-gray-500 text-lg">Nenhum relatório gerado</p>
          <p className="text-gray-400">Selecione um período e clique em "Gerar Relatório"</p>
        </div>
      )}
    </div>
  );
};

export default Relatorio;