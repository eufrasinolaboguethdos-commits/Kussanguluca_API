import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiFilter,
  FiTrendingUp, FiCalendar, FiDollarSign, FiDownload,
  FiChevronLeft, FiChevronRight, FiArrowLeft
} from 'react-icons/fi';
import { receitaService } from '../services/receitaService';
import { useCompanyId } from '../hooks/useCompanyId';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const Receitas = () => {
  const { companyId, loadingCompany } = useCompanyId();
  const navigate = useNavigate();

  const [receitas, setReceitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [ordenacao, setOrdenacao] = useState({ campo: 'data', direcao: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const canCreate = !!companyId;

  const carregarReceitas = useCallback(async () => {
    if (!companyId) { setReceitas([]); setLoading(false); return; }
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

  useEffect(() => {
    if (!loadingCompany) carregarReceitas();
  }, [loadingCompany, carregarReceitas]);

  const abrirModal = (receita = null) => {
    if (!canCreate) return;
    if (receita) {
      setReceitaEditando(receita);
      reset({ descricao: receita.descricao, valor: receita.valor, data: receita.data ? receita.data.split('T')[0] : '', categoria: receita.categoria });
    } else {
      setReceitaEditando(null);
      reset({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: '' });
    }
    setModalAberto(true);
  };

  const fecharModal = () => { setModalAberto(false); setReceitaEditando(null); reset(); };

  const onSubmit = async (data) => {
    if (!companyId) return;
    try {
      const payload = { ...data, valor: parseFloat(data.valor), id_empresa: companyId };
      if (receitaEditando) {
        await receitaService.update(receitaEditando.id_receita || receitaEditando.id, payload);
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

  const formatarValor = (valor) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valor || 0);

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try { return format(new Date(dataString), 'dd/MM/yyyy', { locale: pt }); }
    catch { return dataString; }
  };

  const receitasFiltradas = receitas
    .filter((receita) => {
      const matchTexto = !filtroTexto || receita.descricao?.toLowerCase().includes(filtroTexto.toLowerCase()) || receita.categoria?.toLowerCase().includes(filtroTexto.toLowerCase());
      const matchCategoria = !filtroCategoria || receita.categoria === filtroCategoria;
      const dataReceita = new Date(receita.data);
      const matchDataInicio = !filtroDataInicio || dataReceita >= new Date(filtroDataInicio);
      const matchDataFim = !filtroDataFim || dataReceita <= new Date(filtroDataFim);
      return matchTexto && matchCategoria && matchDataInicio && matchDataFim;
    })
    .sort((a, b) => {
      let valorA = a[ordenacao.campo];
      let valorB = b[ordenacao.campo];
      if (ordenacao.campo === 'data') { valorA = new Date(valorA); valorB = new Date(valorB); }
      return ordenacao.direcao === 'asc' ? (valorA > valorB ? 1 : -1) : (valorA < valorB ? 1 : -1);
    });

  const totalPaginas = Math.ceil(receitasFiltradas.length / itensPorPagina);
  const receitasPaginadas = receitasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);
  const totalReceitas = receitas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  const totalFiltrado = receitasFiltradas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  const categorias = [...new Set(receitas.map(r => r.categoria).filter(Boolean))];

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">A preparar o ambiente da empresa...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Carregando receitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Voltar */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
      >
        <FiArrowLeft size={16} /> Voltar
      </button>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Total em Receitas</p>
              <p className="text-2xl font-extrabold mt-1">{formatarValor(totalReceitas)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl"><FiTrendingUp size={24} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Registos Totais</p>
              <p className="text-3xl font-extrabold text-gray-800 mt-1">{receitas.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl"><FiCalendar className="text-blue-500" size={24} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Total Filtrado</p>
              <p className="text-2xl font-extrabold text-gray-800 mt-1">{formatarValor(totalFiltrado)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl"><FiFilter className="text-purple-500" size={24} /></div>
          </div>
        </div>
      </div>

      {/* ── Barra de ações ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar receitas..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent w-full sm:w-72 text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiFilter size={16} /> Filtros
            </button>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button
              onClick={() => {
                if (!canCreate) return;
                const headers = ['Data', 'Descrição', 'Categoria', 'Valor'];
                const csvContent = [headers.join(';'), ...receitasFiltradas.map(r => [formatarData(r.data), r.descricao, r.categoria, r.valor].join(';'))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `receitas_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              disabled={!canCreate}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                !canCreate ? 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FiDownload size={16} />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <Button
              onClick={() => canCreate && abrirModal()}
              disabled={!canCreate}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold ${
                !canCreate ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200'
              }`}
            >
              <FiPlus size={18} />
              <span className="hidden sm:inline">Nova Receita</span>
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Categoria</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 text-sm">
                <option value="">Todas as categorias</option>
                {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Data Início</label>
              <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Data Fim</label>
              <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => setOrdenacao({ campo: 'data', direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">Data {ordenacao.campo === 'data' && (ordenacao.direcao === 'asc' ? <FiChevronLeft className="rotate-90" size={12} /> : <FiChevronLeft className="-rotate-90" size={12} />)}</div>
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400">Descrição</th>
                <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400">Categoria</th>
                <th className="text-right py-4 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => setOrdenacao({ campo: 'valor', direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center justify-end gap-1">Valor {ordenacao.campo === 'valor' && (ordenacao.direcao === 'asc' ? <FiChevronLeft className="rotate-90" size={12} /> : <FiChevronLeft className="-rotate-90" size={12} />)}</div>
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold uppercase tracking-wide text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {receitasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <FiTrendingUp size={48} className="mb-3" />
                      <p className="text-base font-semibold text-gray-400">Nenhuma receita encontrada</p>
                      <p className="text-sm text-gray-300 mt-1">Crie uma nova receita para começar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                receitasPaginadas.map((receita) => (
                  <tr key={receita.id_receita || receita.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="py-4 px-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2"><FiCalendar size={13} className="text-gray-300" />{formatarData(receita.data)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <FiTrendingUp className="text-emerald-600" size={16} />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{receita.descricao}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {receita.categoria || 'Geral'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-emerald-600">{formatarValor(receita.valor)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => abrirModal(receita)} disabled={!canCreate} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleExcluir(receita.id_receita || receita.id)} disabled={!canCreate} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              Mostrando {(paginaAtual - 1) * itensPorPagina + 1}–{Math.min(paginaAtual * itensPorPagina, receitasFiltradas.length)} de {receitasFiltradas.length}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"><FiChevronLeft size={16} /></button>
              <span className="px-3 py-1.5 text-xs font-semibold text-gray-600">Pág. {paginaAtual}/{totalPaginas}</span>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"><FiChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{receitaEditando ? 'Editar Receita' : 'Nova Receita'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{receitaEditando ? 'Actualize os dados' : 'Preencha os dados da nova receita'}</p>
              </div>
              <button onClick={fecharModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Input label="Descrição *" placeholder="Ex: Venda de produtos..." error={errors.descricao}
                {...register('descricao', { required: 'Descrição é obrigatória', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Valor (AOA) *" type="number" step="0.01" min="0" placeholder="0,00"
                  icon={<FiDollarSign className="text-gray-400" />} error={errors.valor}
                  {...register('valor', { required: 'Valor é obrigatório', min: { value: 0.01, message: 'Valor deve ser maior que 0' }, valueAsNumber: true })} />
                <Input label="Data *" type="date" error={errors.data} {...register('data', { required: 'Data é obrigatória' })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select {...register('categoria')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white text-sm">
                  <option value="">Selecionar categoria...</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Investimentos">Investimentos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" onClick={fecharModal} className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl">Cancelar</Button>
                <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-200">
                  {receitaEditando ? 'Salvar Alterações' : 'Criar Receita'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receitas;