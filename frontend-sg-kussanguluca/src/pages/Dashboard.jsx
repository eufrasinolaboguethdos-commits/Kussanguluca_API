import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { receitaService } from '../services/receitaService';
import { despesaService } from '../services/despesaService';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    transacoesRecentes: []
  });
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar dados da API
      const [receitas, despesas] = await Promise.all([
        receitaService.getAll(),
        despesaService.getAll()
      ]);

      // Calcular totais
      const totalRec = receitas.reduce((sum, r) => sum + parseFloat(r.valor), 0);
      const totalDesp = despesas.reduce((sum, d) => sum + parseFloat(d.valor), 0);
      
      setStats({
        totalReceitas: totalRec,
        totalDespesas: totalDesp,
        saldo: totalRec - totalDesp,
        transacoesRecentes: [...receitas, ...despesas]
          .sort((a, b) => new Date(b.data) - new Date(a.data))
          .slice(0, 5)
      });

      // Dados para gráfico de pizza
      setDadosGrafico([
        { name: 'Receitas', value: totalRec, color: '#10b981' },
        { name: 'Despesas', value: totalDesp, color: '#ef4444' }
      ]);

      // Dados para gráfico de barras (últimos 6 meses)
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
      const dadosBarras = meses.map((mes, index) => ({
        mes,
        indice: index,
        receitas: Math.random() * 50000 + 20000, // Simulado - substituir por dados reais
        despesas: Math.random() * 30000 + 10000  // Simulado - substituir por dados reais
      }));
      setEvolucaoMensal(dadosBarras);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(valor);
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-PT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {user?.nome || 'Utilizador'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Aqui está o resumo financeiro da {user?.empresa || 'sua empresa'}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Receitas */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Receitas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatarValor(stats.totalReceitas)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">+12% este mês</p>
        </div>

        {/* Card Despesas */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Despesas</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatarValor(stats.totalDespesas)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiTrendingDown className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">+5% este mês</p>
        </div>

        {/* Card Saldo */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Líquido</p>
              <p className={`text-2xl font-bold mt-1 ${stats.saldo >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
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

        {/* Gráfico de Barras */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatarValor(value)} />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transações Recentes</h3>
          <button className="text-brand-500 hover:text-brand-700 text-sm font-medium">
            Ver todas
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Descrição</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Data</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Valor</th>
              </tr>
            </thead>
            <tbody>
              {stats.transacoesRecentes.map((transacao, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{transacao.descricao}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transacao.valor > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transacao.valor > 0 ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;