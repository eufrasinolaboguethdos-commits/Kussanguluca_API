import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiFilter,
  FiTrendingUp, FiCalendar, FiDollarSign, FiDownload,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { receitaService } from '../services/receitaService';
import { useCompanyId } from '../hooks/useCompanyId';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const Receitas = () => {
  // Empresa ativa (hidrata do localStorage e valida)
  const { companyId, loadingCompany } = useCompanyId();

  // Estados de dados e UI
  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [receitaEditando, setReceitaEditando] = useState(null);

  // Filtros & ordenação
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [ordenacao, setOrdenacao] = useState({ campo: 'data', direcao: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  // Habilita ações apenas quando houver empresa
  const canCreate = !!companyId;

  // Carregar receitas da empresa ativa
  const carregarReceitas = useCallback(async () => {
    if (!companyId) {
      setReceitas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const dados = await receitaService.getAll(companyId);
      setReceitas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Só dispara depois que o hook terminar de hidratar a empresa
  useEffect(() => {
    if (!loadingCompany) carregarReceitas();
  }, [loadingCompany, carregarReceitas]);

  // Abrir/fechar modal
  const abrirModal = (receita = null) => {
    if (!canCreate) return;

    if (receita) {
      setReceitaEditando(receita);
      reset({
        descricao: receita.descricao,
        valor: receita.valor,
        data: receita.data ? receita.data.split('T')[0] : '',
        categoria: receita.categoria
      });
    } else {
      setReceitaEditando(null);
      reset({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria: ''
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setReceitaEditando(null);
    reset();
  };

  // Criar/Atualizar
  const onSubmit = async (data) => {
    if (!companyId) return;

    try {
      const payload = {
        ...data,
        valor: parseFloat(data.valor),
        id_empresa: companyId
      };

      if (receitaEditando) {
        await receitaService.update(
          receitaEditando.id_receita || receitaEditando.id,
          payload
        );
      } else {
        await receitaService.create(payload);
      }

      fecharModal();
      carregarReceitas();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar receita. Tente novamente.');
    }
  };

  // Excluir
  const handleExcluir = async (id) => {
    if (!canCreate) return;

    if (window.confirm('Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.')) {
      try {
        await receitaService.delete(id);
        carregarReceitas();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir receita.');
      }
    }
  };

  // Helpers de formatação
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(valor || 0);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try {
      return format(new Date(dataString), 'dd/MM/yyyy', { locale: pt });
    } catch {
      return dataString;
    }
  };

  // Filtros, ordenação, paginação
  const receitasFiltradas = receitas
    .filter((receita) => {
      const matchTexto =
        !filtroTexto ||
        receita.descricao?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        receita.categoria?.toLowerCase().includes(filtroTexto.toLowerCase());

      const matchCategoria = !filtroCategoria || receita.categoria === filtroCategoria;

      const dataReceita = new Date(receita.data);
      const matchDataInicio = !filtroDataInicio || dataReceita >= new Date(filtroDataInicio);
      const matchDataFim = !filtroDataFim || dataReceita <= new Date(filtroDataFim);

      return matchTexto && matchCategoria && matchDataInicio && matchDataFim;
    })
    .sort((a, b) => {
      let valorA = a[ordenacao.campo];
      let valorB = b[ordenacao.campo];

      if (ordenacao.campo === 'data') {
        valorA = new Date(valorA);
        valorB = new Date(valorB);
      }

      if (ordenacao.direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

  const totalPaginas = Math.ceil(receitasFiltradas.length / itensPorPagina);
  const receitasPaginadas = receitasFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const totalReceitas = receitas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  const totalFiltrado = receitasFiltradas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);

  // Categorias únicas (para o select)
  const categorias = [...new Set(receitas.map(r => r.categoria).filter(Boolean))];

  // Guard de hidratação da empresa
  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">A preparar o ambiente da empresa...</p>
        </div>
      </div>
    );
  }

  // Loader da própria página
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando receitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total em Receitas</p>
              <p className="text-3xl font-bold mt-1">{formatarValor(totalReceitas)}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FiTrendingUp size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Registros Totais</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{receitas.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FiCalendar className="text-blue-500" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Filtrado</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{formatarValor(totalFiltrado)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <FiFilter className="text-purple-500" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Pesquisar receitas..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-80"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                showFilters ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiFilter size={18} />
              Filtros
            </button>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                if (!canCreate) return;
                const headers = ['Data', 'Descrição', 'Categoria', 'Valor'];
                const csvContent = [
                  headers.join(';'),
                  ...receitasFiltradas.map(r =>
                    [formatarData(r.data), r.descricao, r.categoria, r.valor].join(';')
                  )
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `receitas_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              disabled={!canCreate}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                !canCreate
                  ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiDownload size={18} />
              Exportar
            </button>

            <Button
              onClick={() => canCreate && abrirModal()}
              disabled={!canCreate}
              className={`flex items-center gap-2 ${
                !canCreate
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <FiPlus size={20} />
              Nova Receita
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas as categorias</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th
                  className="text-left py-4 px-6 text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800"
                  onClick={() => setOrdenacao({ campo: 'data', direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}
                >
                  <div className="flex items-center gap-1">
                    Data
                    {ordenacao.campo === 'data' && (
                      ordenacao.direcao === 'asc'
                        ? <FiChevronLeft className="rotate-90" size={14} />
                        : <FiChevronLeft className="-rotate-90" size={14} />
                    )}
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Descrição</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Categoria</th>
                <th
                  className="text-right py-4 px-6 text-sm font-semibold text-gray-600 cursor-pointer hover:text-gray-800"
                  onClick={() => setOrdenacao({ campo: 'valor', direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor
                    {ordenacao.campo === 'valor' && (
                      ordenacao.direcao === 'asc'
                        ? <FiChevronLeft className="rotate-90" size={14} />
                        : <FiChevronLeft className="-rotate-90" size={14} />
                    )}
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receitasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <FiTrendingUp size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhuma receita encontrada</p>
                      <p className="text-sm">Crie uma nova receita para começar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                receitasPaginadas.map((receita) => (
                  <tr key={receita.id_receita || receita.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={14} className="text-gray-400" />
                        {formatarData(receita.data)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <FiTrendingUp className="text-green-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-800">{receita.descricao}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                        {receita.categoria || 'Geral'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-green-600 text-lg">
                        {formatarValor(receita.valor)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => abrirModal(receita)}
                          disabled={!canCreate}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleExcluir(receita.id_receita || receita.id)}
                          disabled={!canCreate}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a {Math.min(paginaAtual * itensPorPagina, receitasFiltradas.length)} de {receitasFiltradas.length} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {receitaEditando ? 'Editar Receita' : 'Nova Receita'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {receitaEditando ? 'Atualize os dados da receita' : 'Preencha os dados da nova receita'}
                </p>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <Input
                label="Descrição *"
                placeholder="Ex: Venda de produtos, Serviço prestado..."
                error={errors.descricao}
                {...register('descricao', {
                  required: 'Descrição é obrigatória',
                  minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Valor (AOA) *"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  icon={<FiDollarSign className="text-gray-400" />}
                  error={errors.valor}
                  {...register('valor', {
                    required: 'Valor é obrigatório',
                    min: { value: 0.01, message: 'Valor deve ser maior que 0' },
                    valueAsNumber: true
                  })}
                />

                <Input
                  label="Data *"
                  type="date"
                  error={errors.data}
                  {...register('data', { required: 'Data é obrigatória' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  {...register('categoria')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">Selecionar categoria...</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Investimentos">Investimentos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {receitaEditando ? 'Salvar Alterações' : 'Criar Receita'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}   

export default Receitas;