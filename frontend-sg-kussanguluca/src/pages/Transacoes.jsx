import React, { useState, useEffect, useCallback } from 'react';
import { useCompanyId } from '../hooks/useCompanyId';
import { receitaService } from '../services/receitaService';
import { despesaService } from '../services/despesaService';
import { useNavigate } from 'react-router-dom';
import {
  FiTrendingUp, FiTrendingDown, FiSearch, FiFilter,
  FiCalendar, FiChevronLeft, FiChevronRight, FiArrowLeft,
  FiDownload
} from 'react-icons/fi';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const formatarValor = (v) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);

const formatarData = (d) => {
  if (!d) return '-';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: pt }); }
  catch { return d; }
};

const Transacoes = () => {
  const { companyId, loadingCompany } = useCompanyId();
  const navigate = useNavigate();

  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(''); // 'receita' | 'despesa' | ''
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState({ campo: 'data', direcao: 'desc' });
  const ITENS_PAG = 15;

  const carregar = useCallback(async () => {
    if (!companyId) { setTransacoes([]); setLoading(false); return; }
    try {
      setLoading(true);
      const [receitas, despesas] = await Promise.all([
        receitaService.getAll(companyId),
        despesaService.getAll(companyId),
      ]);
      const todas = [
        ...(receitas || []).map(r => ({ ...r, tipo: 'receita', _id: `r-${r.id_receita || r.id}` })),
        ...(despesas || []).map(d => ({ ...d, tipo: 'despesa', _id: `d-${d.id_despesa || d.id}` })),
      ];
      setTransacoes(todas);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { if (!loadingCompany) carregar(); }, [loadingCompany, carregar]);

  const filtradas = transacoes
    .filter(t => {
      const matchTexto = !filtroTexto ||
        t.descricao?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        t.categoria?.toLowerCase().includes(filtroTexto.toLowerCase());
      const matchTipo = !filtroTipo || t.tipo === filtroTipo;
      const dt = new Date(t.data);
      return matchTexto && matchTipo &&
        (!filtroDataInicio || dt >= new Date(filtroDataInicio)) &&
        (!filtroDataFim || dt <= new Date(filtroDataFim));
    })
    .sort((a, b) => {
      let vA = a[ordenacao.campo], vB = b[ordenacao.campo];
      if (ordenacao.campo === 'data') { vA = new Date(vA); vB = new Date(vB); }
      if (ordenacao.campo === 'valor') { vA = parseFloat(vA); vB = parseFloat(vB); }
      return ordenacao.direcao === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });

  const totalPaginas = Math.ceil(filtradas.length / ITENS_PAG);
  const paginadas = filtradas.slice((paginaAtual - 1) * ITENS_PAG, paginaAtual * ITENS_PAG);

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + parseFloat(t.valor || 0), 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + parseFloat(t.valor || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  const exportarCSV = () => {
    const csv = ['Data;Tipo;Descrição;Categoria;Valor',
      ...filtradas.map(t => [formatarData(t.data), t.tipo, t.descricao, t.categoria || '', t.valor].join(';'))
    ].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loadingCompany || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <FiArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Todas as Transações</h1>
          <p className="text-gray-400 text-xs mt-0.5">Receitas e despesas combinadas</p>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Receitas</p>
          <p className="text-lg font-extrabold mt-1">{formatarValor(totalReceitas)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-4 text-white shadow-lg">
          <p className="text-rose-100 text-xs font-semibold uppercase tracking-wide">Despesas</p>
          <p className="text-lg font-extrabold mt-1">{formatarValor(totalDespesas)}</p>
        </div>
        <div className={`rounded-2xl p-4 text-white shadow-lg ${saldo >= 0 ? 'bg-gradient-to-br from-brand-500 to-blue-600' : 'bg-gradient-to-br from-rose-600 to-rose-800'}`}>
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Saldo</p>
          <p className="text-lg font-extrabold mt-1">{formatarValor(saldo)}</p>
        </div>
      </div>

      {/* Barra de acções */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input type="text" placeholder="Pesquisar..." value={filtroTexto}
                onChange={(e) => { setFiltroTexto(e.target.value); setPaginaAtual(1); }}
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 w-full text-sm" />
            </div>
            {/* Filtro rápido por tipo */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
              {[['', 'Todos'], ['receita', '↑'], ['despesa', '↓']].map(([val, label]) => (
                <button key={val} onClick={() => { setFiltroTipo(val); setPaginaAtual(1); }}
                  className={`px-3 py-2 text-xs font-semibold transition-colors ${filtroTipo === val ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium flex-shrink-0 ${showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
              <FiFilter size={14} />
            </button>
          </div>
          <button onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <FiDownload size={14} /><span className="hidden sm:inline">Exportar</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Data Início</label>
              <input type="date" value={filtroDataInicio} onChange={(e) => { setFiltroDataInicio(e.target.value); setPaginaAtual(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Data Fim</label>
              <input type="date" value={filtroDataFim} onChange={(e) => { setFiltroDataFim(e.target.value); setPaginaAtual(1); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-400 cursor-pointer"
                  onClick={() => setOrdenacao({ campo: 'data', direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1">
                    Data {ordenacao.campo === 'data' && <FiChevronLeft className={ordenacao.direcao === 'asc' ? 'rotate-90' : '-rotate-90'} size={11} />}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-400">Descrição</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-400 hidden sm:table-cell">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-400 hidden md:table-cell">Categoria</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-gray-400 cursor-pointer"
                  onClick={() => setOrdenacao({ campo: 'valor', direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center justify-end gap-1">
                    Valor {ordenacao.campo === 'valor' && <FiChevronLeft className={ordenacao.direcao === 'asc' ? 'rotate-90' : '-rotate-90'} size={11} />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginadas.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Nenhuma transação encontrada</td></tr>
              ) : paginadas.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><FiCalendar size={11} className="text-gray-300" />{formatarData(t.data)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.tipo === 'receita' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        {t.tipo === 'receita'
                          ? <FiTrendingUp className="text-emerald-600" size={13} />
                          : <FiTrendingDown className="text-rose-500" size={13} />}
                      </div>
                      <span className="font-medium text-gray-800 text-sm truncate max-w-[120px] sm:max-w-[180px]">{t.descricao}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                      t.tipo === 'receita'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {t.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-xs text-gray-400">{t.categoria || '—'}</span>
                  </td>
                  <td className={`py-3 px-4 text-right font-bold text-sm whitespace-nowrap ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.tipo === 'receita' ? '+' : '-'}{formatarValor(t.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              {(paginaAtual - 1) * ITENS_PAG + 1}–{Math.min(paginaAtual * ITENS_PAG, filtradas.length)} de {filtradas.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30">
                <FiChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-600 px-2">{paginaAtual}/{totalPaginas}</span>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30">
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé info */}
      <p className="text-center text-xs text-gray-300">{filtradas.length} transação{filtradas.length !== 1 ? 'ões' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default Transacoes;