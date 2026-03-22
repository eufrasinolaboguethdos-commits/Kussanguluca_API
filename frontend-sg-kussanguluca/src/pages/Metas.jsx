import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCompanyId } from '../hooks/useCompanyId';
import { metaService } from '../services/metaService';
import {
  FiTarget, FiPlus, FiTrash2, FiX, FiCheckCircle,
  FiAlertTriangle, FiTrendingUp, FiTrendingDown
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const formatarValor = (v) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const BarraProgresso = ({ valor, /*max = 100,*/ cor }) => {
  const perc = Math.min(valor, 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${cor}`}
        style={{ width: `${perc}%` }}
      />
    </div>
  );
};

const Metas = () => {
  const { companyId, loadingCompany } = useCompanyId();
  const [metaActual, setMetaActual] = useState(null);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const agora = new Date();
  const { register, handleSubmit, reset, formState: { /*errors,*/ isSubmitting } } = useForm({
    defaultValues: { mes: agora.getMonth() + 1, ano: agora.getFullYear() }
  });

  const carregar = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [actual, todas] = await Promise.all([
        metaService.actual(companyId),
        metaService.listar(companyId)
      ]);
      setMetaActual(actual);
      setMetas(todas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingCompany) carregar();
  }, [companyId, loadingCompany]);

  const onSubmit = async (data) => {
    try {
      await metaService.criar({
        ...data,
        id_empresa: companyId,
        meta_receita: parseFloat(data.meta_receita || 0),
        meta_despesa_max: parseFloat(data.meta_despesa_max || 0)
      });
      reset();
      setModalAberto(false);
      carregar();
    } catch (err) {
        console.error(err);
      alert('Erro ao criar meta.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar esta meta?')) return;
    await metaService.eliminar(id);
    carregar();
  };

  if (loadingCompany || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-brand-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-brand-50 rounded-xl"><FiTarget className="text-brand-500" size={18} /></span>
            Metas Financeiras
          </h1>
          <p className="text-gray-400 text-sm mt-1 ml-10">Defina e acompanhe as metas mensais</p>
        </div>
        <Button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md text-sm font-semibold px-4 py-2.5">
          <FiPlus size={16} /> Nova Meta
        </Button>
      </div>

      {/* Meta do mês actual */}
      {metaActual?.existe ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">
              Meta de {MESES[metaActual.mes - 1]} {metaActual.ano}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              metaActual.estado === 'meta_atingida' ? 'bg-emerald-50 text-emerald-700' :
              metaActual.estado === 'meta_falhada'  ? 'bg-rose-50 text-rose-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {metaActual.estado === 'meta_atingida' ? '✓ Meta Atingida' :
               metaActual.estado === 'meta_falhada'  ? '✗ Meta Falhada' : '⏳ Em Curso'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meta de Receita */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FiTrendingUp className="text-emerald-600" size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Meta de Receita</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Realizado</span>
                <span className="font-bold text-emerald-600">{formatarValor(metaActual.receita_realizada)}</span>
              </div>
              <BarraProgresso
                valor={metaActual.progressoReceita}
                cor={metaActual.progressoReceita >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{metaActual.progressoReceita?.toFixed(1)}% atingido</span>
                <span>Meta: {formatarValor(metaActual.meta_receita)}</span>
              </div>
              {metaActual.metaReceitaAtingida && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                  <FiCheckCircle size={13} /> Meta de receita atingida! 🎉
                </div>
              )}
            </div>

            {/* Limite de Despesa */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <FiTrendingDown className="text-rose-600" size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Limite de Despesa</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gasto</span>
                <span className="font-bold text-rose-600">{formatarValor(metaActual.despesa_realizada)}</span>
              </div>
              <BarraProgresso
                valor={metaActual.progressoDespesa}
                cor={metaActual.progressoDespesa >= 100 ? 'bg-rose-500' : metaActual.progressoDespesa >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{metaActual.progressoDespesa?.toFixed(1)}% do limite</span>
                <span>Limite: {formatarValor(metaActual.meta_despesa_max)}</span>
              </div>
              {metaActual.alertaDespesa && (
                <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold">
                  <FiAlertTriangle size={13} /> Próximo do limite de despesa!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="p-4 bg-gray-50 rounded-2xl inline-block mb-3">
            <FiTarget className="text-gray-300" size={40} />
          </div>
          <p className="text-gray-500 font-semibold">Nenhuma meta para este mês</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Define uma meta para acompanhar o teu progresso</p>
          <Button onClick={() => setModalAberto(true)}
            className="rounded-xl bg-brand-500 text-white text-sm px-4 py-2">
            <FiPlus size={14} className="mr-1.5" /> Criar Meta
          </Button>
        </div>
      )}

      {/* Histórico de Metas */}
      {metas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">Histórico de Metas</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {metas.map(meta => (
              <div key={meta.id_meta} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm">
                    {MESES[meta.mes - 1]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{MESES[meta.mes - 1]} {meta.ano}</p>
                    <p className="text-xs text-gray-400">
                      Receita: {formatarValor(meta.meta_receita)} • Limite: {formatarValor(meta.meta_despesa_max)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    meta.estado === 'meta_atingida' ? 'bg-emerald-50 text-emerald-700' :
                    meta.estado === 'meta_falhada'  ? 'bg-rose-50 text-rose-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {meta.progressoReceita?.toFixed(0)}%
                  </span>
                  <button onClick={() => handleEliminar(meta.id_meta)}
                    className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Nova Meta Mensal</h2>
              <button onClick={() => { setModalAberto(false); reset(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês *</label>
                  <select {...register('mes', { required: true })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 bg-white text-sm">
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <Input label="Ano *" type="number" min="2024" max="2030"
                  {...register('ano', { required: true, valueAsNumber: true })} />
              </div>
              <Input label="Meta de Receita (AOA)" type="number" step="0.01" min="0" placeholder="0,00"
                {...register('meta_receita', { valueAsNumber: true })} />
              <Input label="Limite de Despesa (AOA)" type="number" step="0.01" min="0" placeholder="0,00"
                {...register('meta_despesa_max', { valueAsNumber: true })} />
              <div className="flex gap-3 pt-2">
                <Button type="button" onClick={() => { setModalAberto(false); reset(); }}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl">Cancelar</Button>
                <Button type="submit" isLoading={isSubmitting}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 rounded-xl text-white shadow-md">
                  Criar Meta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Metas;