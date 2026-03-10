import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts e Proteção
import AuthLayout from '../pages/AuthLayout';
import AppLayout from '../pages/AppLayout';
import PrivateRoute from './PrivateRoute';

// Páginas Públicas
import Login from '../pages/Login';
import Register from '../pages/Register';

// Páginas Privadas
import Dashboard from '../pages/Dashboard';
import Receitas from '../pages/Receitas';
import Despesas from '../pages/Despesas';
import Relatorio from '../pages/Relatorio';
import Empresa from '../pages/Empresa'; // Cria se quiseres
import CompanySelector from '../pages/CompanySelector';
import Termos from '../pages/Termos';
import Privacidade from '../pages/Privacidade';
import ForgotPassword from '../pages/ForgotPassword';








export const router = createBrowserRouter([
  // --- ROTAS PÚBLICAS ---
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: '/', element: <Navigate to="/login" replace /> },
      { path:"/termos", element: <Termos />},
      { path:"/privacidade", element: <Privacidade />},
    ],
  },

  // --- ROTAS PRIVADAS ---
  {
    path: '/',
    // Primeiro verificamos se está logado
    element: <PrivateRoute />,
    children: [
      {
        // Se estiver logado, usamos o layout principal
        element: <AppLayout />,
        children: [
           // Aqui definimos as páginas internas
          { path: 'company-selector', element: <CompanySelector /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'receitas', element: <Receitas /> },
          { path: 'despesas', element: <Despesas /> },
          { path: 'relatorios', element: <Relatorio /> },
          { path: 'empresa', element: <Empresa /> },
        ],
      },
    ],
  },

  {
    path: '*',
    element: <div className="h-screen flex items-center justify-center text-2xl">404 - Página não encontrada</div>
  }
]);