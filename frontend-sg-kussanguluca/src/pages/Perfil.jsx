import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiSave, FiArrowLeft,
  FiShield, FiCheckCircle, FiEdit2, FiTrash2,
  FiAlertTriangle, FiSend, FiKey, FiEye, FiEyeOff
} from 'react-icons/fi';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const Perfil = () => {
  // ✅ Lógica original preservada 100%
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [abaActiva, setAbaActiva] = useState('info');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [etapaEliminacao, setEtapaEliminacao] = useState(() => {
    const guardado = localStorage.getItem('eliminacao_etapa');
    if (!guardado) return 'idle';
    const { etapa, expiracao } = JSON.parse(guardado);
    // Se passaram mais de 24h, limpa
    if (Date.now() > expiracao) {
      localStorage.removeItem('eliminacao_etapa');
      return 'idle';
    }
    return etapa;
  });
  const guardarEtapa = (etapa) => {
    if (etapa === 'idle') {
      localStorage.removeItem('eliminacao_etapa');
    } else {
      localStorage.setItem('eliminacao_etapa', JSON.stringify({
        etapa,
        expiracao: Date.now() + 24 * 60 * 60 * 1000 // 24h
      }));
    }
    setEtapaEliminacao(etapa);
  };
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

  const limparEstado = () => { setErro(''); setMensagem(''); guardarEtapa('idle'); };

  // ✅ Funções onSubmit originais - INTOCADAS
  const onSubmitInfo = async (data) => {
    try {
      setErro('');
      await api.put('/usuarios/perfil', data);
      await refreshUser();
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
      guardarEtapa('aguardar');
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

  // Estados adicionais APENAS para toggle de senha (não afetam lógica)
  const [mostrarSenhaActual, setMostrarSenhaActual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmSenha, setMostrarConfirmSenha] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5 relative">
      {/* Partículas decorativas flutuantes */}
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-brand-400/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-20 -right-4 w-24 h-24 bg-purple-400/20 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
      <div className="absolute bottom-20 left-1/2 w-16 h-16 bg-blue-400/15 rounded-full blur-2xl animate-float-slow pointer-events-none" />

      <div className="flex items-center gap-3 relative z-10 animate-fade-in-down">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors group" aria-label="Voltar">
          <FiArrowLeft size={20} className="text-gray-500 group-hover:text-brand-600 transition-colors" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
            Perfil
          </h1>
          <p className="text-gray-400 text-xs mt-0.5 tracking-wide">Gerencie as suas informações pessoais</p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl animate-fade-in-up">
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-brand-500 opacity-10 blur-3xl animate-pulse-slow" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-purple-500 opacity-10 blur-2xl animate-float-delayed" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg flex-shrink-0 ring-4 ring-white/10">
            {inicial}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.nome || 'Utilizador'}</h2>
            <p className="text-slate-300 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-brand-500/20 border border-brand-400/30 rounded-full text-xs font-semibold text-brand-300">
              <FiShield size={11} /> {user?.perfil || 'empreendedor'}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Mensagem de sucesso original - Agora com animação */}
      {mensagem && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-md animate-slide-down-fade relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-emerald-100/50 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-success" />
          <FiCheckCircle className="text-emerald-600 flex-shrink-0 animate-pulse-success relative z-10" size={22} />
          <p className="text-emerald-800 font-semibold text-sm relative z-10">{mensagem}</p>
        </div>
      )}

      {/* ✅ Mensagem de erro original - Agora com animação */}
      {erro && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3 text-red-700 shadow-md animate-slide-down-fade relative overflow-hidden group p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/0 via-red-100/50 to-red-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-error" />
          <FiAlertTriangle size={22} className="flex-shrink-0 mt-0.5 animate-pulse-error relative z-10" />
          <span className="text-sm font-medium leading-relaxed relative z-10">{erro}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative z-10">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'info', label: 'Informações', icon: FiUser },
            { id: 'senha', label: 'Senha', icon: FiLock },
            { id: 'conta', label: 'Conta', icon: FiShield },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setAbaActiva(tab.id); limparEstado(); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${abaActiva === tab.id
                  ? tab.id === 'conta' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-brand-500 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }`} aria-selected={abaActiva === tab.id} role="tab">
              <tab.icon size={14} aria-hidden="true" />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6" role="tabpanel">

          {abaActiva === 'info' && (
            <form onSubmit={subInfo(onSubmitInfo)} className="space-y-5 animate-fade-in-up" noValidate>
              {/* Input Nome com ícone */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Nome Completo *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                    <FiUser size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="O seu nome"
                    onFocus={() => setErro('')}
                    {...regInfo('nome', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                      errInfo.nome 
                        ? 'border-red-300 focus:border-red-500 animate-shake' 
                        : 'border-gray-200 focus:border-brand-500'
                    }`}
                  />
                </div>
                {errInfo.nome && (
                  <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                    <FiAlertTriangle size={12} />
                    {errInfo.nome.message}
                  </p>
                )}
              </div>

              {/* Input Email com ícone */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                    <FiMail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    onFocus={() => setErro('')}
                    {...regInfo('email', { required: 'Email é obrigatório', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' } })}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                      errInfo.email 
                        ? 'border-red-300 focus:border-red-500 animate-shake' 
                        : 'border-gray-200 focus:border-brand-500'
                    }`}
                  />
                </div>
                {errInfo.email && (
                  <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                    <FiAlertTriangle size={12} />
                    {errInfo.email.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={subInfoLoading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {subInfoLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        A guardar...
                      </>
                    ) : (
                      <><FiSave size={18} /> Guardar Alterações</>
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}

          {abaActiva === 'senha' && (
            <form onSubmit={subSenha(onSubmitSenha)} className="space-y-5 animate-fade-in-up" noValidate>
              {/* Input Senha Actual com ícone e toggle */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Senha Actual *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                    <FiLock size={20} />
                  </div>
                  <input
                    type={mostrarSenhaActual ? 'text' : 'password'}
                    placeholder="••••••••"
                    onFocus={() => setErro('')}
                    {...regSenha('senhaActual', { required: 'Senha actual obrigatória' })}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                      errSenha.senhaActual 
                        ? 'border-red-300 focus:border-red-500 animate-shake' 
                        : 'border-gray-200 focus:border-brand-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaActual(!mostrarSenhaActual)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                  >
                    {mostrarSenhaActual ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errSenha.senhaActual && (
                  <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                    <FiAlertTriangle size={12} />
                    {errSenha.senhaActual.message}
                  </p>
                )}
              </div>

              {/* Input Nova Senha com ícone e toggle */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Nova Senha *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                    <FiLock size={20} />
                  </div>
                  <input
                    type={mostrarNovaSenha ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    onFocus={() => setErro('')}
                    {...regSenha('novaSenha', { required: 'Nova senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                      errSenha.novaSenha 
                        ? 'border-red-300 focus:border-red-500 animate-shake' 
                        : 'border-gray-200 focus:border-brand-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                  >
                    {mostrarNovaSenha ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errSenha.novaSenha && (
                  <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                    <FiAlertTriangle size={12} />
                    {errSenha.novaSenha.message}
                  </p>
                )}
              </div>

              {/* Input Confirmar Nova Senha com ícone e toggle */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Confirmar Nova Senha *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                    <FiLock size={20} />
                  </div>
                  <input
                    type={mostrarConfirmSenha ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    onFocus={() => setErro('')}
                    {...regSenha('confirmarSenha', { required: 'Confirmação obrigatória', validate: v => v === novaSenha || 'As senhas não coincidem' })}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                      errSenha.confirmarSenha 
                        ? 'border-red-300 focus:border-red-500 animate-shake' 
                        : 'border-gray-200 focus:border-brand-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmSenha(!mostrarConfirmSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-all duration-300 hover:scale-110 focus:outline-none"
                  >
                    {mostrarConfirmSenha ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errSenha.confirmarSenha && (
                  <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                    <FiAlertTriangle size={12} />
                    {errSenha.confirmarSenha.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={subSenhaLoading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {subSenhaLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        A alterar...
                      </>
                    ) : (
                      <><FiEdit2 size={18} /> Alterar Senha</>
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}

          {abaActiva === 'conta' && (
            <div className="space-y-5 animate-fade-in-up">

              {etapaEliminacao === 'idle' && (
                <>
                  <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-5 flex gap-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-100/0 via-rose-100/30 to-rose-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-error" />
                    <FiAlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5 animate-pulse-error relative z-10" size={24} />
                    <div className="relative z-10">
                      <p className="text-rose-800 font-bold text-sm">Zona de perigo</p>
                      <p className="text-rose-600 text-xs mt-1.5 leading-relaxed">
                        A eliminação de conta é uma acção irreversível. O pedido será analisado pela nossa equipa antes de ser processado. Só será aprovado se o motivo for legítimo e convincente.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setEtapaEliminacao('motivo')}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 hover:border-rose-400 transition-all duration-300 hover:scale-[1.01] shadow-sm hover:shadow-md">
                    <FiTrash2 size={18} /> Solicitar eliminação da conta
                  </button>
                </>
              )}

              {etapaEliminacao === 'motivo' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex gap-4 shadow-sm">
                    <FiAlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-amber-800 text-xs leading-relaxed">
                      Explique detalhadamente o motivo pelo qual deseja eliminar a sua conta. O pedido será enviado à nossa equipa para análise. Apenas motivos legítimos serão aprovados.
                    </p>
                  </div>
                  <form onSubmit={subMotivo(onSubmitMotivo)} className="space-y-5" noValidate>
                    <div className="relative group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Motivo do pedido *</label>
                      <textarea 
                        rows={5} 
                        placeholder="Explique detalhadamente o motivo... (mínimo 20 caracteres)"
                        onFocus={() => setErro('')}
                        className={`w-full px-4 py-3.5 border-2 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-rose-300/20 resize-none transition-all duration-300 hover:border-amber-300 ${
                          errMotivo.motivo 
                            ? 'border-red-300 focus:border-red-500 animate-shake bg-red-50' 
                            : 'border-gray-200 focus:border-brand-500'
                        }`}
                        {...regMotivo('motivo', { required: 'O motivo é obrigatório', minLength: { value: 20, message: 'Mínimo 20 caracteres — seja detalhado' } })} 
                      />
                      <div className="flex justify-between mt-2">
                        {errMotivo.motivo ? (
                          <p className="text-red-600 text-xs flex items-center gap-1 animate-fade-in">
                            <FiAlertTriangle size={12} />
                            {errMotivo.motivo.message}
                          </p>
                        ) : <span />}
                        <span className={`text-xs font-semibold ${motivoTexto.length < 20 ? 'text-rose-400' : 'text-emerald-500'}`}>
                          {motivoTexto.length} caracteres
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button 
                        type="button" 
                        onClick={() => { setEtapaEliminacao('idle'); setErro(''); }}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={enviando}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 disabled:opacity-60 hover:scale-[1.02] disabled:hover:scale-100"
                      >
                        {enviando ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <><FiSend size={16} /> Enviar pedido</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {etapaEliminacao === 'aguardar' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 text-center shadow-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-emerald-100/30 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-success" />
                    <FiCheckCircle className="text-emerald-500 mx-auto mb-3 animate-bounce-slow relative z-10" size={40} />
                    <p className="text-emerald-800 font-bold text-base relative z-10">Pedido enviado com sucesso!</p>
                    <p className="text-emerald-600 text-xs mt-2 leading-relaxed relative z-10">
                      A nossa equipa irá analisar o seu motivo. Se aprovado, receberá um código de confirmação no email <strong>{user?.email}</strong>.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <p className="text-blue-800 text-xs leading-relaxed flex items-center gap-2">
                      <FiMail size={14} className="text-blue-500" />
                      Verifique a sua caixa de entrada e pasta de spam. O código tem validade de <strong>24 horas</strong>.
                    </p>
                  </div>
                  <button 
                    onClick={() => guardarEtapa('codigo')}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-[1.02]"
                  >
                    <FiKey size={18} /> Já tenho o código
                  </button>
                  <button 
                    onClick={() => { guardarEtapa('idle'); setErro(''); }}
                    className="w-full py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
                  >
                    Cancelar pedido
                  </button>
                </div>
              )}

              {etapaEliminacao === 'codigo' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-xl p-5 flex gap-4 shadow-sm">
                    <FiKey className="text-rose-500 flex-shrink-0 mt-0.5 animate-pulse-error" size={20} />
                    <p className="text-rose-700 text-xs leading-relaxed">
                      Insira o código de 6 dígitos que recebeu no email <strong>{user?.email}</strong>. Esta acção é <strong className="text-rose-600">irreversível</strong>.
                    </p>
                  </div>
                  <form onSubmit={subCodigo(onSubmitCodigo)} className="space-y-5" noValidate>
                    <div className="relative group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Código de confirmação *</label>
                      <input 
                        type="text" 
                        maxLength={6} 
                        placeholder="000000"
                        onFocus={() => setErro('')}
                        className={`w-full px-4 py-4 border-2 rounded-xl text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-rose-300/20 transition-all duration-300 hover:border-rose-300 ${
                          errCodigo.codigo 
                            ? 'border-red-300 focus:border-red-500 animate-shake bg-red-50' 
                            : 'border-gray-200 focus:border-brand-500'
                        }`}
                        {...regCodigo('codigo', { required: 'O código é obrigatório', minLength: { value: 6, message: 'O código tem 6 dígitos' }, maxLength: { value: 6, message: 'O código tem 6 dígitos' } })} 
                      />
                      {errCodigo.codigo && (
                        <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 animate-fade-in">
                          <FiAlertTriangle size={12} />
                          {errCodigo.codigo.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button 
                        type="button" 
                        onClick={() => { setEtapaEliminacao('aguardar'); setErro(''); }}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                      >
                        Voltar
                      </button>
                      <button 
                        type="submit" 
                        disabled={eliminando}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 disabled:opacity-60 hover:scale-[1.02] disabled:hover:scale-100"
                      >
                        {eliminando ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <><FiTrash2 size={16} /> Eliminar conta</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Keyframes de animações customizadas */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 100%;
            background-position: 0% 50%;
          }
          50% {
            background-size: 200% 100%;
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-15px) translateX(-10px);
            opacity: 0.5;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-25px) scale(1.1);
            opacity: 0.4;
          }
        }

        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-down-fade {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 200px;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        @keyframes pulse-error {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-success {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes shimmer-error {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes shimmer-success {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-slide-down-fade {
          animation: slide-down-fade 0.4s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-pulse-error {
          animation: pulse-error 2s ease-in-out infinite;
        }

        .animate-pulse-success {
          animation: pulse-success 2s ease-in-out infinite;
        }

        .animate-shimmer-error {
          animation: shimmer-error 2s linear infinite;
        }

        .animate-shimmer-success {
          animation: shimmer-success 2s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default Perfil;