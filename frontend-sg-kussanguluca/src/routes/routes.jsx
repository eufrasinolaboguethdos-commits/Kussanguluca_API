import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts e Proteção
import AuthLayout   from '../pages/AuthLayout';
import AppLayout    from '../pages/AppLayout';
import PrivateRoute from './PrivateRoute';

// Páginas Públicas
import Login          from '../pages/Login';
import Register       from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Termos         from '../pages/Termos';
import Privacidade    from '../pages/Privacidade';

// Páginas Privadas — existentes
import Dashboard       from '../pages/Dashboard';
import Receitas        from '../pages/Receitas';
import Despesas        from '../pages/Despesas';
import Relatorio       from '../pages/Relatorio';
import Empresa         from '../pages/Empresa';
import CompanySelector from '../pages/CompanySelector';

// Páginas Privadas — NOVAS
import SaudeFinanceira from '../pages/SaudeFinanceira';
import FluxoCaixa      from '../pages/FluxoCaixa';
import Contas          from '../pages/Contas';
import Metas           from '../pages/Metas';

export const router = createBrowserRouter([

  // ── ROTAS PÚBLICAS ──────────────────────────────────────────
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login',           element: <Login /> },
      { path: 'register',        element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: '/',               element: <Navigate to="/login" replace /> },
      { path: 'termos',          element: <Termos /> },
      { path: 'privacidade',     element: <Privacidade /> },
    ],
  },

  // ── ROTAS PRIVADAS ──────────────────────────────────────────
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Existentes
          { path: 'company-selector', element: <CompanySelector /> },
          { path: 'dashboard',        element: <Dashboard /> },
          { path: 'receitas',         element: <Receitas /> },
          { path: 'despesas',         element: <Despesas /> },
          { path: 'relatorios',       element: <Relatorio /> },
          { path: 'empresa',          element: <Empresa /> },

          // ── NOVAS PÁGINAS DA PLATAFORMA ──
          { path: 'saude',  element: <SaudeFinanceira /> },
          { path: 'fluxo',  element: <FluxoCaixa /> },
          { path: 'contas', element: <Contas /> },
          { path: 'metas',  element: <Metas /> },
        ],
      },
    ],
  },

  // ── 404 ─────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="text-6xl font-extrabold text-gray-200">404</p>
        <p className="text-lg mt-2">Página não encontrada</p>
        <a href="/dashboard" className="mt-4 text-brand-500 hover:underline text-sm">
          Voltar ao Dashboard →
        </a>
      </div>
    )
  }
]);