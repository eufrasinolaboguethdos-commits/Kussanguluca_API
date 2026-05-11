import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiAlertCircle, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  // ✅ Lógica original preservada 100%
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  // Estado adicional APENAS para toggle de senha (não afeta lógica)
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // ✅ Função onSubmit original - INTOCADA
  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Tenta fazer o login
      await signIn(data);
      setTimeout(() => {
        navigate('/company-selector', { replace: true });
      }, 100); // Redireciona para o company-selector após sucesso
    
    } catch (error) {
      console.error('Erro no login:', error);

      // Garantir que estamos acessando o erro de maneira segura
      if (error.response && error.response.data && error.response.data.message) {
        // Caso o erro tenha a estrutura esperada (resposta do backend com message)
        setLoginError(error.response.data.message);
      } else {
        // Caso o erro seja genérico ou de outra natureza (sem message)
        setLoginError('Email ou senha incorretos. Tente novamente.');
      }
    } finally {
      setIsLoading(false); // Desativa o loading
    }
  };

  return (
    <div className="w-full relative">
      {/* Partículas decorativas flutuantes */}
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-brand-400/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-400/20 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-blue-400/15 rounded-full blur-2xl animate-float-slow pointer-events-none" />

      {/* Header com gradiente animado */}
      <div className="mb-8 text-center relative z-10 animate-fade-in-down">
        <h2 className="text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 animate-gradient-x drop-shadow-sm">
          Seja Bem-Vindo!
        </h2>
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Acede à tua conta S.G Kussanguluca
        </p>
        <div className="mt-3 flex justify-center">
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent rounded-full animate-pulse-slow" />
        </div>
      </div>

      {/* ✅ Mensagem de erro original - Agora com animação */}
      {loginError && (
        <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3 text-red-700 shadow-md animate-slide-down-fade relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/0 via-red-100/50 to-red-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-error" />
          <FiAlertCircle size={22} className="flex-shrink-0 mt-0.5 animate-pulse-error relative z-10" />
          <span className="text-sm font-medium leading-relaxed relative z-10">{loginError}</span>
        </div>
      )}

      {/* ✅ Form original - validações e register preservados */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in-up relative z-10">
        
        {/* Input Email com ícone */}
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
              <FiMail size={20} />
            </div>
            <input
              type="email"
              placeholder="exemplo@email.com"
              onFocus={() => setLoginError('')}
              {...register('email', {
                required: 'O email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Endereço de email inválido'
                }
              })}
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

        {/* Input Senha com ícone e toggle */}
        <div className="relative group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Palavra-passe</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-300 pointer-events-none">
              <FiLock size={20} />
            </div>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="••••••••"
              onFocus={() => setLoginError('')}
              {...register('senha', {
                required: 'A palavra-passe é obrigatória',
                minLength: { value: 6, message: 'Mínimo de 6 caracteres' }
              })}
              className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 hover:border-brand-300 ${
                errors.senha 
                  ? 'border-red-300 focus:border-red-500 animate-shake' 
                  : 'border-gray-200 focus:border-brand-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-all duration-300 hover:scale-110 focus:outline-none"
            >
              {mostrarSenha ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          {errors.senha && (
            <p className="mt-1.5 text-xs text-red-600 ml-1 flex items-center gap-1 animate-fade-in">
              <FiAlertCircle size={12} />
              {errors.senha.message}
            </p>
          )}
        </div>

        {/* Lembrar-me & Esqueceu senha */}
        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer group/check">
            <div className="relative">
              <input 
                type="checkbox" 
                className="peer sr-only" 
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all duration-300 peer-checked:scale-110" />
              <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium group-hover/check:text-brand-600 transition-colors">Lembrar-me</span>
          </label>
          
          <Link 
            to="/forgot-password" 
            className="font-semibold text-brand-600 hover:text-brand-700 relative group/link transition-colors"
          >
            Esqueceu a senha?
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 group-hover/link:w-full transition-all duration-300" />
          </Link>
        </div>

        {/* ✅ Botão Submit original - Agora com efeitos visuais */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            {/* Efeito shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />
            
            {/* Conteúdo do botão */}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </span>
          </button>
        </div>
      </form>

      {/* Footer com link para registro */}
      <div className="mt-8 text-center relative z-10 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
          <span className="text-xs text-gray-400 font-medium">OU</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
        </div>
        
        <p className="text-sm text-gray-600">
          Ainda não tens conta?{' '}
          <Link 
            to="/register" 
            className="font-bold text-brand-600 hover:text-brand-700 relative group/register transition-colors inline-block"
          >
            Regista-te gratuitamente
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-600 to-purple-600 group-hover/register:w-full transition-all duration-300" />
          </Link>
        </p>
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

        @keyframes shimmer-error {
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

        .animate-pulse-error {
          animation: pulse-error 2s ease-in-out infinite;
        }

        .animate-shimmer-error {
          animation: shimmer-error 2s linear infinite;
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

export default Login;