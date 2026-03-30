import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiSave, FiArrowLeft,
  FiShield, FiCheckCircle, FiEdit2, FiTrash2,
  FiAlertTriangle, FiSend, FiKey
} from 'react-icons/fi';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const Perfil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [abaActiva, setAbaActiva] = useState('info');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [etapaEliminacao, setEtapaEliminacao] = useState('idle');
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const { register: regInfo, handleSubmit: subInfo, formState: { errors: errInfo, isSubmitting: subInfoLoading } } = useForm({
    defaultValues: { nome: user?.nome || '', email: user?.email || '' }
  });
  const { register: regSenha, handleSubmit: subSenha, reset: resetSenha, watch, formState: { errors: errSenha, isSubmitting: subSenhaLoading } } = useForm();
  const { register: regMotivo, handleSubmit: subMotivo, watch: watchMotivo, formState: { errors: errMotivo } } = useForm();
  const { register: regCodigo, handleSubmit: subCodigo, formState: { errors: errCodigo } } = useForm();

  const novaSenha = watch('novaSenha');
  const motivoTexto = watchMotivo('motivo') || '';

  const limparEstado = () => { setErro(''); setMensagem(''); setEtapaEliminacao('idle'); };

  const onSubmitInfo = async (data) => {
    try {
      setErro('');
      await api.put('/usuarios/perfil', data);
      setMensagem('Dados actualizados com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao actualizar dados.');
    }
  };

  const onSubmitSenha = async (data) => {
    try {
      setErro('');
      await api.put('/usuarios/senha', { senhaActual: data.senhaActual, novaSenha: data.novaSenha });
      setMensagem('Senha alterada com sucesso!');
      resetSenha();
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao alterar senha.');
    }
  };

  const onSubmitMotivo = async (data) => {
    try {
      setErro('');
      setEnviando(true);
      await api.post('/eliminacao/pedido', { motivo: data.motivo });
      setEtapaEliminacao('aguardar');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const onSubmitCodigo = async (data) => {
    try {
      setErro('');
      setEliminando(true);
      await api.post('/eliminacao/confirmar', { codigo: data.codigo });
      signOut();
      navigate('/login');
    } catch (err) {
      setErro(err.response?.data?.error || 'Código inválido. Verifique o email e tente novamente.');
      setEliminando(false);
    }
  };

  const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : '?';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Voltar">
          <FiArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Perfil</h1>
          <p className="text-gray-400 text-xs mt-0.5">Gerencie as suas informações pessoais</p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-brand-500 opacity-10 blur-3xl" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg flex-shrink-0">{inicial}</div>
          <div>
            <h2 className="text-xl font-bold">{user?.nome || 'Utilizador'}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-brand-500/20 border border-brand-400/30 rounded-full text-xs font-semibold text-brand-300">
              <FiShield size={11} /> {user?.perfil || 'empreendedor'}
            </span>
          </div>
        </div>
      </div>

      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={18} />
          <p className="text-emerald-800 font-medium text-sm">{mensagem}</p>
        </div>
      )}
      {erro && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <p className="text-rose-700 font-medium text-sm">{erro}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'info',  label: 'Informações', icon: FiUser },
            { id: 'senha', label: 'Senha',        icon: FiLock },
            { id: 'conta', label: 'Conta',        icon: FiShield },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setAbaActiva(tab.id); limparEstado(); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${
                abaActiva === tab.id
                  ? tab.id === 'conta' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-brand-500 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`} aria-selected={abaActiva === tab.id} role="tab">
              <tab.icon size={14} aria-hidden="true" />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6" role="tabpanel">

          {abaActiva === 'info' && (
            <form onSubmit={subInfo(onSubmitInfo)} className="space-y-4" noValidate>
              <Input label="Nome Completo *" icon={<FiUser className="text-gray-400" />} error={errInfo.nome}
                {...regInfo('nome', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} />
              <Input label="Email *" type="email" icon={<FiMail className="text-gray-400" />} error={errInfo.email}
                {...regInfo('email', { required: 'Email é obrigatório', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' } })} />
              <div className="pt-2">
                <Button type="submit" isLoading={subInfoLoading} className="w-full rounded-xl shadow-md py-2.5">
                  <FiSave size={15} className="mr-2" /> Guardar Alterações
                </Button>
              </div>
            </form>
          )}

          {abaActiva === 'senha' && (
            <form onSubmit={subSenha(onSubmitSenha)} className="space-y-4" noValidate>
              <Input label="Senha Actual *" type="password" icon={<FiLock className="text-gray-400" />} error={errSenha.senhaActual}
                {...regSenha('senhaActual', { required: 'Senha actual obrigatória' })} />
              <Input label="Nova Senha *" type="password" icon={<FiLock className="text-gray-400" />} error={errSenha.novaSenha}
                {...regSenha('novaSenha', { required: 'Nova senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
              <Input label="Confirmar Nova Senha *" type="password" icon={<FiLock className="text-gray-400" />} error={errSenha.confirmarSenha}
                {...regSenha('confirmarSenha', { required: 'Confirmação obrigatória', validate: v => v === novaSenha || 'As senhas não coincidem' })} />
              <div className="pt-2">
                <Button type="submit" isLoading={subSenhaLoading} className="w-full rounded-xl shadow-md py-2.5 bg-brand-500 hover:bg-brand-600 text-white">
                  <FiEdit2 size={15} className="mr-2" /> Alterar Senha
                </Button>
              </div>
            </form>
          )}

          {abaActiva === 'conta' && (
            <div className="space-y-5">

              {etapaEliminacao === 'idle' && (
                <>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3">
                    <FiAlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-rose-800 font-semibold text-sm">Zona de perigo</p>
                      <p className="text-rose-600 text-xs mt-1 leading-relaxed">
                        A eliminação de conta é uma acção irreversível. O pedido será analisado pela nossa equipa antes de ser processado. Só será aprovado se o motivo for legítimo e convincente.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setEtapaEliminacao('motivo')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-rose-200 text-rose-600 font-semibold text-sm hover:bg-rose-50 hover:border-rose-400 transition-all">
                    <FiTrash2 size={16} /> Solicitar eliminação da conta
                  </button>
                </>
              )}

              {etapaEliminacao === 'motivo' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <FiAlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-amber-800 text-xs leading-relaxed">
                      Explique detalhadamente o motivo pelo qual deseja eliminar a sua conta. O pedido será enviado à nossa equipa para análise. Apenas motivos legítimos serão aprovados.
                    </p>
                  </div>
                  <form onSubmit={subMotivo(onSubmitMotivo)} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motivo do pedido *</label>
                      <textarea rows={5} placeholder="Explique detalhadamente o motivo... (mínimo 20 caracteres)"
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none ${errMotivo.motivo ? 'border-rose-400 bg-rose-50' : 'border-gray-200'}`}
                        {...regMotivo('motivo', { required: 'O motivo é obrigatório', minLength: { value: 20, message: 'Mínimo 20 caracteres — seja detalhado' } })} />
                      <div className="flex justify-between mt-1">
                        {errMotivo.motivo ? <p className="text-rose-500 text-xs">{errMotivo.motivo.message}</p> : <span />}
                        <span className={`text-xs ${motivoTexto.length < 20 ? 'text-rose-400' : 'text-emerald-500'}`}>{motivoTexto.length} caracteres</span>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => { setEtapaEliminacao('idle'); setErro(''); }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancelar</button>
                      <button type="submit" disabled={enviando}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                        {enviando ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><FiSend size={14} /> Enviar pedido</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {etapaEliminacao === 'aguardar' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                    <FiCheckCircle className="text-emerald-500 mx-auto mb-3" size={32} />
                    <p className="text-emerald-800 font-semibold text-sm">Pedido enviado com sucesso!</p>
                    <p className="text-emerald-600 text-xs mt-2 leading-relaxed">
                      A nossa equipa irá analisar o seu motivo. Se aprovado, receberá um código de confirmação no email <strong>{user?.email}</strong>.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 text-xs leading-relaxed">
                      📧 Verifique a sua caixa de entrada e pasta de spam. O código tem validade de <strong>24 horas</strong>.
                    </p>
                  </div>
                  <button onClick={() => setEtapaEliminacao('codigo')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors">
                    <FiKey size={16} /> Já tenho o código
                  </button>
                  <button onClick={() => { setEtapaEliminacao('idle'); setErro(''); }}
                    className="w-full py-2.5 text-gray-400 text-sm hover:text-gray-600 transition-colors">Cancelar pedido</button>
                </div>
              )}

              {etapaEliminacao === 'codigo' && (
                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3">
                    <FiKey className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-rose-700 text-xs leading-relaxed">
                      Insira o código de 6 dígitos que recebeu no email <strong>{user?.email}</strong>. Esta acção é irreversível.
                    </p>
                  </div>
                  <form onSubmit={subCodigo(onSubmitCodigo)} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código de confirmação *</label>
                      <input type="text" maxLength={6} placeholder="000000"
                        className={`w-full px-4 py-3 border rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-300 ${errCodigo.codigo ? 'border-rose-400 bg-rose-50' : 'border-gray-200'}`}
                        {...regCodigo('codigo', { required: 'O código é obrigatório', minLength: { value: 6, message: 'O código tem 6 dígitos' }, maxLength: { value: 6, message: 'O código tem 6 dígitos' } })} />
                      {errCodigo.codigo && <p className="text-rose-500 text-xs mt-1">{errCodigo.codigo.message}</p>}
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => { setEtapaEliminacao('aguardar'); setErro(''); }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Voltar</button>
                      <button type="submit" disabled={eliminando}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                        {eliminando ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><FiTrash2 size={14} /> Eliminar conta</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;