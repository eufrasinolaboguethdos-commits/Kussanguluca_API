import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign, FiPlus, FiTrash2, FiRefreshCw,
  FiArrowLeft, FiCheckCircle, FiAlertTriangle,
  FiCalendar, FiTrendingUp
} from 'react-icons/fi';
import { useCompanyId } from '../hooks/useCompanyId';
import { taxaService } from '../services/taxaService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const formatarData = (d) => {
  if (!d) return '-';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: pt }); }
  catch { return d; }
};
const formatarValor = (v) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);

const TaxaCambio = () => {
  const navigate = useNavigate();
  const { companyId, loadingCompany } = useCompanyId()
  const [taxaActual, setTaxaActual] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  // Conversor rápido
  const [valorConverter, setValorConverter] = useState('');
  const [moedaConverter, setMoedaConverter] = useState('USD');
  const [resultadoConverter, setResultadoConverter] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { data: new Date().toISOString().split('T')[0], fonte: 'manual' }
  });

  const carregar = async () => {
    try {
      setLoading(true);
      const [actual, hist] = await Promise.all([
        taxaService.obterActual(companyId).catch(() => null),
        taxaService.historico(companyId,30).catch(() => []),
      ]);
      setTaxaActual(actual);
      setHistorico(hist || []);
    } catch { /* ignorar erro */ }
    finally { setLoading(false); }
  };

  useEffect(() => {  
    if (loadingCompany) return; 
    if (!companyId){ 
      setLoading(false);
       return;
      } carregar();
     }, [companyId, loadingCompany]);

  const onSubmit = async (data) => {
    try {
      setErro('');
      await taxaService.registar({
        id_empresa: companyId,
        data: data.data,
        usd_para_kz: parseFloat(data.usd_para_kz),
        eur_para_kz: data.eur_para_kz ? parseFloat(data.eur_para_kz) : null,
        fonte: data.fonte || 'manual'
      });
      setMensagem('Taxa registada com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
      setModalAberto(false);
      reset({ data: new Date().toISOString().split('T')[0], fonte: 'manual' });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao registar taxa.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar esta taxa?')) return;
    try {
      await taxaService.eliminar(id);
      carregar();
    } catch { /* ignorar erro */ }
  };

  const handleConverter = async () => {
    if (!valorConverter || !moedaConverter) return;
    try {
      const resultado = await taxaService.converter(valorConverter, moedaConverter, companyId);
      setResultadoConverter(resultado);
    } catch { /* ignorar erro */ }
  };

  // Dados do gráfico — ordem cronológica
  const dadosGrafico = [...historico].reverse().map(t => ({
    data: t.data?.substring(0, 10),
    USD: parseFloat(t.usd_para_kz),
    EUR: t.eur_para_kz ? parseFloat(t.eur_para_kz) : null,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-500" />
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

  return (
    <div className="space-y-5 animate-fade-in-up max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="p-2 bg-brand-50 rounded-xl"><FiDollarSign className="text-brand-500" size={18} /></span>
              Taxa de Câmbio
            </h1>
            <p className="text-gray-400 text-xs mt-0.5 ml-10">Gestão de taxas USD/EUR para AOA</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={carregar} className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <FiRefreshCw size={16} />
          </button>
          <Button onClick={() => setModalAberto(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm shadow-md">
            <FiPlus size={16} /> Nova Taxa
          </Button>
        </div>
      </div>

      {/* Mensagens */}
      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={18} />
          <p className="text-emerald-800 font-medium text-sm">{mensagem}</p>
        </div>
      )}
      {erro && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertTriangle className="text-rose-600 flex-shrink-0" size={18} />
          <p className="text-rose-700 font-medium text-sm">{erro}</p>
        </div>
      )}

      {/* Cards taxa actual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 p-5 text-white shadow-lg sm:col-span-1">
          <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white opacity-5" />
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Taxa Actual USD</p>
          {taxaActual ? (
            <>
              <p className="text-2xl font-extrabold">{parseFloat(taxaActual.usd_para_kz).toLocaleString('pt-AO')} Kz</p>
              <p className="text-blue-200 text-xs mt-1">1 USD = {parseFloat(taxaActual.usd_para_kz).toLocaleString('pt-AO')} AOA</p>
              <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1">
                <FiCalendar size={10} /> {formatarData(taxaActual.data)} • {taxaActual.fonte}
              </p>
            </>
          ) : (
            <p className="text-blue-200 text-sm mt-1">Sem taxa registada</p>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white opacity-5" />
          <p className="text-purple-100 text-xs font-semibold uppercase tracking-wide mb-1">Taxa Actual EUR</p>
          {taxaActual?.eur_para_kz ? (
            <>
              <p className="text-2xl font-extrabold">{parseFloat(taxaActual.eur_para_kz).toLocaleString('pt-AO')} Kz</p>
              <p className="text-purple-200 text-xs mt-1">1 EUR = {parseFloat(taxaActual.eur_para_kz).toLocaleString('pt-AO')} AOA</p>
            </>
          ) : (
            <p className="text-purple-200 text-sm mt-1">Sem taxa registada</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Registos</p>
          <p className="text-3xl font-extrabold text-gray-800">{historico.length}</p>
          <p className="text-gray-400 text-xs mt-1">taxas no histórico</p>
          {historico.length > 0 && (
            <p className="text-gray-300 text-xs mt-0.5">
              Última: {formatarData(historico[0]?.data)}
            </p>
          )}
        </div>
      </div>

      {/* Conversor rápido */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-brand-500" size={16} /> Conversor Rápido
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Valor</label>
            <input
              type="number"
              value={valorConverter}
              onChange={(e) => setValorConverter(e.target.value)}
              placeholder="Ex: 100"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Moeda</label>
            <select
              value={moedaConverter}
              onChange={(e) => setMoedaConverter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <Button
            onClick={handleConverter}
            disabled={!taxaActual || !valorConverter}
            className="rounded-xl px-4 py-2.5 text-sm shadow-md disabled:opacity-40"
          >
            Converter
          </Button>
          {resultadoConverter && (
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-600 font-semibold">
                {resultadoConverter.valorOriginal} {resultadoConverter.moeda} =
              </p>
              <p className="text-lg font-extrabold text-emerald-700">
                {formatarValor(resultadoConverter.valorAOA)}
              </p>
              <p className="text-[10px] text-emerald-500">Taxa: {resultadoConverter.taxa} AOA/{resultadoConverter.moeda}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico evolução */}
      {dadosGrafico.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">Evolução da Taxa USD/AOA</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosGrafico} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="data" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v?.substring(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="USD" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="USD → AOA" />
                <Line type="monotone" dataKey="EUR" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} name="EUR → AOA" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela histórico */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-blue-50">
          <h3 className="text-sm font-bold text-brand-800">Histórico de Taxas</h3>
        </div>
        {historico.length === 0 ? (
          <div className="py-12 text-center">
            <FiDollarSign size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">Nenhuma taxa registada</p>
            <p className="text-gray-300 text-xs mt-1">Clica em "Nova Taxa" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-400">Data</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-gray-400">USD → AOA</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-gray-400">EUR → AOA</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold uppercase text-gray-400">Fonte</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold uppercase text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historico.map((t, i) => (
                  <tr key={t.id_taxa} className={`hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-brand-50/30' : ''}`}>
                    <td className="py-3 px-4 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={13} className="text-gray-300" />
                        {formatarData(t.data)}
                        {i === 0 && <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-full">Actual</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600 text-sm">
                      {parseFloat(t.usd_para_kz).toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-purple-600 text-sm">
                      {t.eur_para_kz ? `${parseFloat(t.eur_para_kz).toLocaleString('pt-AO')} Kz` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.fonte === 'BNA' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {t.fonte}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleEliminar(t.id_taxa)}
                        className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nova taxa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Registar Taxa de Câmbio</h2>
                <p className="text-xs text-gray-400 mt-0.5">Insere a taxa do dia em AOA</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <Input
                label="Data *"
                type="date"
                error={errors.data}
                {...register('data', { required: 'Data obrigatória' })}
              />
              <Input
                label="USD → AOA *"
                type="number"
                step="0.01"
                min="1"
                placeholder="Ex: 885.00"
                icon={<span className="text-gray-400 text-xs font-bold">$</span>}
                error={errors.usd_para_kz}
                {...register('usd_para_kz', { required: 'Taxa USD obrigatória', min: { value: 1 } })}
              />
              <Input
                label="EUR → AOA (opcional)"
                type="number"
                step="0.01"
                min="1"
                placeholder="Ex: 950.00"
                icon={<span className="text-gray-400 text-xs font-bold">€</span>}
                {...register('eur_para_kz')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fonte</label>
                <select {...register('fonte')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 bg-white">
                  <option value="manual">Manual</option>
                  <option value="BNA">BNA (Banco Nacional de Angola)</option>
                </select>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  💡 Se já existe uma taxa para esta data, será actualizada automaticamente.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" onClick={() => setModalAberto(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="flex-1 rounded-xl shadow-md">
                  Guardar Taxa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxaCambio;