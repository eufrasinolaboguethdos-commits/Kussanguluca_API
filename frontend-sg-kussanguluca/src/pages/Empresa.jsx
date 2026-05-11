import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiHome, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave,
  FiPlus, FiTrash2, FiCheckCircle, FiArrowLeft, FiBriefcase,
  FiAlertCircle, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import empresaService from '../services/empresaService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const Empresas = () => {
  // ✅ Lógica original preservada 100%
  const { user: _user, activeCompany, setActiveCompany } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [modo, setModo] = useState('lista');
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { carregarEmpresas(); }, []);

  const carregarEmpresas = async () => {
    try {
      setLoading(true);
      const dados = await empresaService.getByUser();
      setEmpresas(dados);
      const savedId = localStorage.getItem('activeCompanyId');
      if (savedId && !activeCompany) {
        const empresa = dados.find(e => String(e.id_empresa) === String(savedId));
        if (empresa) setActiveCompany(empresa);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = () => {
    setModo('criar');
    setEmpresaEditando(null);
    reset({ nome: '', NIF: '', setor: '', email: '', telefone: '', endereco: '', cidade: '', provincia: '' });
  };

  const handleEditar = (empresa) => { setModo('editar'); setEmpresaEditando(empresa); reset(empresa); };

  const handleSelecionar = (empresa) => {
    localStorage.setItem('activeCompanyId', String(empresa.id_empresa));
    setActiveCompany(empresa);
    setMensagem(`Empresa "${empresa.nome}" selecionada!`);
    setTimeout(() => setMensagem(''), 2000);
  };

  // ✅ Função onSubmit original - INTOCADA
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (modo === 'criar') {
        const novaEmpresa = await empresaService.create(data);
        setEmpresas([...empresas, novaEmpresa]);
        setMensagem('Empresa criada com sucesso!');
        if (empresas.length === 0) {
          setActiveCompany(novaEmpresa);
          localStorage.setItem('activeCompanyId', String(novaEmpresa.id_empresa));
        }
      } else {
        await empresaService.update(empresaEditando.id_empresa, data);
        const atualizadas = empresas.map(e => e.id_empresa === empresaEditando.id_empresa ? { ...e, ...data } : e);
        setEmpresas(atualizadas);
        setMensagem('Empresa atualizada com sucesso!');
        if (activeCompany?.id_empresa === empresaEditando.id_empresa) setActiveCompany({ ...activeCompany, ...data });
      }
      setModo('lista');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) return;
    try {
      await empresaService.delete(id);
      setEmpresas(empresas.filter(e => e.id_empresa !== id));
      if (activeCompany?.id_empresa === id) { setActiveCompany(null); localStorage.removeItem('activeCompanyId'); }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir empresa.');
    }
  };

  const voltar = () => { if (modo === 'lista') { navigate('/dashboard'); } else { setModo('lista'); } };

  // ── LISTA ───────────────────────────────────────────────────
  if (modo === 'lista') {
    return (
      <div className="space-y-5 max-w-5xl mx-auto relative">
        {/* Partículas decorativas flutuantes */}
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-brand-400/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute top-20 -right-4 w-24 h-24 bg-purple-400/20 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
        <div className="absolute bottom-20 left-1/2 w-16 h-16 bg-blue-400/15 rounded-full blur-2xl animate-float-slow pointer-events-none" />

        {/* Header com gradiente animado */}
        <div className="flex items-center justify-between relative z-10 animate-fade-in-down">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-br from-brand-500 to-blue-600 rounded-xl shadow-lg shadow-brand-500/20">
                <FiBriefcase className="text-white" size={20} />
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-gradient-x">
                Minhas Empresas
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 ml-14 tracking-wide">Gerencie as suas empresas e seleccione qual usar</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={voltar} 
              className="flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-sm px-4 py-2.5 font-semibold transition-all duration-300 hover:scale-[1.02]"
            >
              <FiArrowLeft size={16} /> Voltar
            </button>
            <button 
              onClick={handleCriar} 
              className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-sm px-4 py-2.5 font-semibold shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <FiPlus size={16} /> Nova Empresa
            </button>
          </div>
        </div>

        {/* ✅ Mensagem de sucesso original - Agora com animação */}
        {mensagem && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-md animate-slide-down-fade relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-emerald-100/50 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-success" />
            <div className="p-1.5 bg-emerald-100 rounded-lg flex-shrink-0 relative z-10">
              <FiCheckCircle className="text-emerald-600 animate-pulse-success" size={16} />
            </div>
            <p className="text-emerald-800 font-semibold text-sm relative z-10">{mensagem}</p>
          </div>
        )}

        {/* Lista vazia */}
        {empresas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center relative overflow-hidden animate-fade-in-up">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-brand-500 opacity-5 blur-3xl" />
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl inline-block mb-4 shadow-inner">
              <FiBriefcase className="text-gray-300" size={48} />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-gray-400 text-sm mb-6">Crie a sua primeira empresa para começar</p>
            <button 
              onClick={handleCriar} 
              className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 px-5 py-2.5 font-semibold transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 mx-auto"
            >
              <FiPlus size={16} /> Criar Empresa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            {empresas.map((empresa) => {
              const savedId = localStorage.getItem('activeCompanyId');
              const isAtiva = String(empresa.id_empresa) === String(savedId) ||
                              activeCompany?.id_empresa === empresa.id_empresa;
              const initials = empresa.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

              return (
                <div
                  key={empresa.id_empresa}
                  className={`bg-white rounded-2xl shadow-sm p-6 border-2 transition-all duration-300 hover:scale-[1.01] relative overflow-hidden group ${
                    isAtiva
                      ? 'border-brand-400 shadow-lg shadow-brand-100/50'
                      : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Efeito shimmer no hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000 ${isAtiva ? 'hidden' : ''}`} />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold tracking-tight transition-all duration-300 ${
                      isAtiva
                        ? 'bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-md shadow-brand-500/30'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500'
                    }`}>
                      {initials}
                    </div>
                    {isAtiva && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-brand-50 to-blue-50 text-brand-700 border border-brand-200 rounded-full text-xs font-bold animate-pulse-slow">
                        <FiCheckCircle size={12} /> Ativa
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-0.5 relative z-10">{empresa.nome}</h3>
                  <p className="text-xs text-gray-400 mb-5 relative z-10">{empresa.setor} • NIF: {empresa.NIF}</p>

                  <div className="flex gap-2 relative z-10">
                    <button
                      onClick={() => handleSelecionar(empresa)}
                      disabled={isAtiva}
                      className={`flex-1 rounded-xl text-sm font-bold py-2.5 transition-all duration-300 ${
                        isAtiva
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-100 cursor-default'
                          : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md'
                      }`}
                    >
                      {isAtiva ? '✓ Selecionada' : 'Selecionar'}
                    </button>
                    <button
                      onClick={() => handleEditar(empresa)}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleExcluir(empresa.id_empresa)}
                      className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── FORMULÁRIO ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Partículas decorativas flutuantes */}
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-brand-400/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-20 -right-4 w-24 h-24 bg-purple-400/20 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
      <div className="absolute bottom-20 left-1/2 w-16 h-16 bg-blue-400/15 rounded-full blur-2xl animate-float-slow pointer-events-none" />

      {/* Header formulário */}
      <div className="flex items-center gap-4 mb-6 relative z-10 animate-fade-in-down">
        <button onClick={voltar} className="p-2 hover:bg-gray-100 rounded-xl transition-colors group">
          <FiArrowLeft size={20} className="text-gray-500 group-hover:text-brand-600 transition-colors" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
            {modo === 'criar' ? 'Nova Empresa' : 'Editar Empresa'}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5 tracking-wide">
            {modo === 'criar' ? 'Preencha os dados da nova empresa' : 'Actualize os dados da empresa'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 relative z-10 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Input Nome da Empresa com ícone */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Nome da Empresa *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                <FiHome size={20} />
              </div>
              <input
                type="text"
                placeholder="Nome da empresa"
                {...register('nome', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                  errors.nome 
                    ? 'border-red-300 focus:border-red-500 animate-shake' 
                    : 'border-gray-200 focus:border-brand-500'
                }`}
              />
            </div>
            {errors.nome && (
              <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                <FiAlertCircle size={12} />
                {errors.nome.message}
              </p>
            )}
          </div>

          {/* Input NIF com ícone */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">NIF *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                <FiBriefcase size={20} />
              </div>
              <input
                type="text"
                placeholder="0000000000"
                {...register('NIF', { required: 'NIF é obrigatório', pattern: { value: /^[0-9]{10}$/, message: 'NIF deve ter 10 dígitos' } })}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                  errors.NIF 
                    ? 'border-red-300 focus:border-red-500 animate-shake' 
                    : 'border-gray-200 focus:border-brand-500'
                }`}
              />
            </div>
            {errors.NIF && (
              <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                <FiAlertCircle size={12} />
                {errors.NIF.message}
              </p>
            )}
          </div>

          {/* Select Setor estilizado */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Setor de Atividade</label>
            <div className="relative">
              <select 
                {...register('setor')} 
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white transition-all duration-300 hover:border-brand-300 appearance-none cursor-pointer"
              >
                <option value="Tecnologia">Tecnologia</option>
                <option value="Comércio">Comércio</option>
                <option value="Serviços">Serviços</option>
                <option value="Indústria">Indústria</option>
                <option value="Agricultura">Agricultura</option>
                <option value="Construção">Construção</option>
                <option value="Outro">Outro</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Input Email com ícone */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email Corporativo *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                <FiMail size={20} />
              </div>
              <input
                type="email"
                placeholder="empresa@email.com"
                {...register('email', { required: 'Email é obrigatório', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' } })}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 animate-shake' 
                    : 'border-gray-200 focus:border-brand-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                <FiAlertCircle size={12} />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Input Telefone com ícone */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Telefone *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                <FiPhone size={20} />
              </div>
              <input
                type="text"
                placeholder="+244 900 000 000"
                {...register('telefone', { required: 'Telefone é obrigatório' })}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                  errors.telefone 
                    ? 'border-red-300 focus:border-red-500 animate-shake' 
                    : 'border-gray-200 focus:border-brand-500'
                }`}
              />
            </div>
            {errors.telefone && (
              <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                <FiAlertCircle size={12} />
                {errors.telefone.message}
              </p>
            )}
          </div>

          {/* Input Cidade com ícone */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Cidade *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
                <FiMapPin size={20} />
              </div>
              <input
                type="text"
                placeholder="Luanda"
                {...register('cidade', { required: 'Cidade é obrigatória' })}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                  errors.cidade 
                    ? 'border-red-300 focus:border-red-500 animate-shake' 
                    : 'border-gray-200 focus:border-brand-500'
                }`}
              />
            </div>
            {errors.cidade && (
              <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
                <FiAlertCircle size={12} />
                {errors.cidade.message}
              </p>
            )}
          </div>
        </div>

        {/* Input Endereço com ícone */}
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Endereço Completo *</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
              <FiMapPin size={20} />
            </div>
            <input
              type="text"
              placeholder="Rua, número, bairro"
              {...register('endereco', { required: 'Endereço é obrigatório' })}
              className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                errors.endereco 
                  ? 'border-red-300 focus:border-red-500 animate-shake' 
                  : 'border-gray-200 focus:border-brand-500'
              }`}
            />
          </div>
          {errors.endereco && (
            <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
              <FiAlertCircle size={12} />
              {errors.endereco.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={voltar} 
            className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl py-3.5 font-bold text-sm transition-all duration-300 hover:scale-[1.02]"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  A guardar...
                </>
              ) : (
                <><FiSave size={18} /> {modo === 'criar' ? 'Criar Empresa' : 'Salvar Alterações'}</>
              )}
            </span>
          </button>
        </div>
      </form>

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

        @keyframes shimmer-success {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
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

        .animate-pulse-success {
          animation: pulse-success 2s ease-in-out infinite;
        }

        .animate-shimmer-success {
          animation: shimmer-success 2s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

export default Empresas;