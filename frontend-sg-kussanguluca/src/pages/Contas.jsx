import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCompanyId } from '../hooks/useCompanyId';
import { contaService } from '../services/contaService';
import {
  FiCreditCard, FiPlus, FiCheck, FiTrash2, FiAlertTriangle,
  FiCalendar, FiX, FiArrowUp, FiArrowDown, FiClock
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const formatarValor = (v) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);

const formatarData = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pt-PT');
};

const Contas = () => {
  const { companyId, loadingCompany } = useCompanyId();
  const [contas, setContas] = useState([]);
  const [resumo, setResumo] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendente');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const carregar = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [c, r] = await Promise.all([
        contaService.listar(companyId, { tipo: filtroTipo, estado: filtroEstado }),
        contaService.resumo(companyId)
      ]);
      setContas(c);
      setResumo(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingCompany) carregar();
    if (!companyId) {
      setLoading(false); // ← para o loading
      return;
    }
  }, [companyId, loadingCompany, filtroTipo, filtroEstado]);

  const onSubmit = async (data) => {
    try {
      await contaService.criar({ ...data, valor: parseFloat(data.valor), id_empresa: companyId });
      reset();
      setModalAberto(false);
      carregar();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar conta.');
    }
  };

  const handlePagar = async (id) => {
    if (!window.confirm('Marcar esta conta como paga?')) return;
    await contaService.pagar(id);
    carregar();
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar esta conta?')) return;
    await contaService.eliminar(id);
    carregar();
  };

  const estadoCor = {
    pendente: 'bg-amber-50 text-amber-700 border-amber-200',
    pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    vencido: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelado: 'bg-gray-50 text-gray-500 border-gray-200',
  };

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

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-brand-50 rounded-xl"><FiCreditCard className="text-brand-500" size={18} /></span>
            Contas a Pagar e Receber
          </h1>
          <p className="text-gray-400 text-sm mt-1 ml-10">Controlo de compromissos financeiros</p>
        </div>
        <Button onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md text-sm font-semibold px-4 py-2.5">
          <FiPlus size={16} /> Nova Conta
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">A Receber</p>
              <p className="text-xl font-extrabold mt-1">{formatarValor(resumo.total_receber)}</p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl"><FiArrowDown size={20} /></div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white opacity-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs font-semibold uppercase tracking-wide">A Pagar</p>
              <p className="text-xl font-extrabold mt-1">{formatarValor(resumo.total_pagar)}</p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-xl"><FiArrowUp size={20} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Vencidas</p>
              <p className="text-xl font-extrabold text-rose-600 mt-1">{formatarValor(resumo.total_vencido)}</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl"><FiAlertTriangle className="text-rose-500" size={20} /></div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="flex gap-2">
          {['', 'receber', 'pagar'].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroTipo === t ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t === '' ? 'Todos' : t === 'receber' ? '↓ Receber' : '↑ Pagar'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['pendente', 'pago', 'vencido', ''].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroEstado === e ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {e === '' ? 'Todos' : e === 'pendente' ? 'Pendente' : e === 'pago' ? 'Pago' : 'Vencido'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {contas.length === 0 ? (
          <div className="py-16 text-center">
            <div className="p-4 bg-gray-50 rounded-2xl inline-block mb-3">
              <FiCreditCard className="text-gray-300" size={40} />
            </div>
            <p className="text-gray-400 font-semibold">Nenhuma conta encontrada</p>
            <p className="text-gray-300 text-sm mt-1">Crie uma nova conta para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contas.map(conta => (
              <div key={conta.id_conta}
                className={`p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors ${conta.alerta_vencimento ? 'border-l-4 border-amber-400' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${conta.tipo === 'receber' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {conta.tipo === 'receber'
                      ? <FiArrowDown className="text-emerald-600" size={16} />
                      : <FiArrowUp className="text-rose-600" size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{conta.descricao}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {conta.entidade && <span className="text-xs text-gray-400">{conta.entidade}</span>}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FiCalendar size={11} /> {formatarData(conta.data_vencimento)}
                      </span>
                      {conta.alerta_vencimento && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                          <FiAlertTriangle size={11} /> Vence em breve
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`text-sm font-bold ${conta.tipo === 'receber' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatarValor(conta.valor)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${estadoCor[conta.estado] || estadoCor.pendente}`}>
                    {conta.estado}
                  </span>
                  <div className="flex gap-1">
                    {conta.estado === 'pendente' && (
                      <button onClick={() => handlePagar(conta.id_conta)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Marcar como pago">
                        <FiCheck size={15} />
                      </button>
                    )}
                    <button onClick={() => handleEliminar(conta.id_conta)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Nova Conta</h2>
              <button onClick={() => { setModalAberto(false); reset(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select {...register('tipo', { required: true })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-400 bg-white text-sm">
                  <option value="">Seleccionar...</option>
                  <option value="pagar">A Pagar</option>
                  <option value="receber">A Receber</option>
                </select>
              </div>
              <Input label="Descrição *" placeholder="Ex: Fornecedor XYZ, Cliente ABC..."
                error={errors.descricao}
                {...register('descricao', { required: 'Obrigatório' })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Valor (AOA) *" type="number" step="0.01" min="0" placeholder="0,00"
                  error={errors.valor}
                  {...register('valor', { required: 'Obrigatório', min: 0.01, valueAsNumber: true })} />
                <Input label="Data Vencimento *" type="date"
                  error={errors.data_vencimento}
                  {...register('data_vencimento', { required: 'Obrigatório' })} />
              </div>
              <Input label="Entidade (cliente/fornecedor)" placeholder="Nome opcional"
                {...register('entidade')} />
              <div className="flex gap-3 pt-2">
                <Button type="button" onClick={() => { setModalAberto(false); reset(); }}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl">Cancelar</Button>
                <Button type="submit" isLoading={isSubmitting}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 rounded-xl text-white shadow-md">
                  Criar Conta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contas;