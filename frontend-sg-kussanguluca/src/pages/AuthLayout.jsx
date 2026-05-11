import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiTrendingUp } from 'react-icons/fi'; // Exemplo de ícone

// Este componente vai envolver as páginas de Login e Registo
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-gray-100 relative overflow-hidden">
      {/* Lado Esquerdo - Branding/Visual (Escondido em telemóveis) */}
      <div className="hidden lg:flex w-1/2 bg-brand-700 justify-center items-center relative overflow-hidden">
        {/* Gradientes animados com overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 opacity-95"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-purple-600/20 animate-pulse-slow"></div>
        
        {/* Orbes flutuantes decorativas com blur */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-float"></div>
        
        {/* Linhas decorativas animadas */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent animate-shimmer"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent animate-shimmer-delayed"></div>
        </div>

        <div className="relative z-10 text-white text-center p-12">
             {/* AQUI ENTRARIA A TUA ANIMAÇÃO DOS "BONECOS" NO FUTURO */}
             {/* Por agora, usamos um ícone e texto bonito com animação CSS */}
             <div className="animate-fade-in-up">
                {/* Container do ícone com glow effect */}
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse-glow"></div>
                  <FiTrendingUp className="text-8xl mx-auto relative z-10 drop-shadow-2xl animate-bounce-slow" />
                </div>
                
                <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white animate-gradient-x drop-shadow-lg">
                  S.G Kussanguluca
                </h1>
                <p className="text-xl font-light text-blue-50 drop-shadow-md">
                  Gestão financeira inteligente e profissional.
                </p>
                
                {/* Linha decorativa animada */}
                <div className="mt-8 flex justify-center">
                  <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse-slow rounded-full"></div>
                </div>
             </div>
        </div>
        {/* Podes por uma imagem de fundo aqui se quiseres */}
        {/* <img src="/tua-imagem-fundo.jpg" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" /> */}
      </div>

      {/* Lado Direito - O Formulário (Outlet) */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-4 md:p-8 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 relative">
        {/* Efeito de brilho sutil no fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Partículas decorativas pequenas */}
        <div className="absolute top-10 right-10 w-2 h-2 bg-brand-400/40 rounded-full animate-float blur-sm"></div>
        <div className="absolute bottom-20 left-10 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-float-delayed blur-sm"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/30 rounded-full animate-float-slow blur-sm"></div>
        
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-brand-500/10 p-6 md:p-8 animate-fade-in-up border border-white/50 relative overflow-hidden">
            {/* Brilho sutil no topo do card */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"></div>
            
            {/* O 'Outlet' é onde o React Router vai injetar o Login ou o Registo */}
            <Outlet />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% {
            transform: translateY(-30px) translateX(20px) scale(1.05);
          }
          66% {
            transform: translateY(-15px) translateX(-20px) scale(0.95);
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.1;
            transform: translateY(0);
          }
          50% {
            opacity: 0.3;
            transform: translateY(-20px);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
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

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 12s ease-in-out infinite 2s;
        }

        .animate-float-slow {
          animation: float 15s ease-in-out infinite 1s;
        }

        .animate-shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }

        .animate-shimmer-delayed {
          animation: shimmer 4s ease-in-out infinite 2s;
        }

        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;