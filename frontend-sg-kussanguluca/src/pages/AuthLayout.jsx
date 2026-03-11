// src/pages/AuthLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { FiTrendingUp } from 'react-icons/fi'; // Exemplo de ícone

// Este componente vai envolver as páginas de Login e Registo
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Lado Esquerdo - Branding/Visual (Escondido em telemóveis) */}
      <div className="hidden lg:flex w-1/2 bg-brand-700 i justify-center items-center relative overflow-hidden">
        {/* Um exemplo de background com gradiente bonito */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-800 opacity-90"></div>

        <div className="relative z-10 text-white text-center p-12">
             {/* AQUI ENTRARIA A TUA ANIMAÇÃO DOS "BONECOS" NO FUTURO */}
             {/* Por agora, usamos um ícone e texto bonito com animação CSS */}
             <div className="animate-fade-in-up">
                <FiTrendingUp className="text-8xl mx-auto mb-6" />
                <h1 className="text-5xl font-bold mb-4">S.G Kussanguluca</h1>
                <p className="text-xl font-light">Gestão financeira inteligente e profissional.</p>
             </div>
        </div>
        {/* Podes por uma imagem de fundo aqui se quiseres */}
        {/* <img src="/tua-imagem-fundo.jpg" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" /> */}
      </div>

      {/* Lado Direito - O Formulário (Outlet) */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 md:p-8 animate-fade-in-up">
            {/* O 'Outlet' é onde o React Router vai injetar o Login ou o Registo */}
            <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;