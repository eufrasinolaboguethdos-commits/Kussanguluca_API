import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = () => {
  // 1. Usa 'user' e 'loading' que são os nomes reais no teu AuthProvider
  const { user, loading } = useAuth();

  // 2. ESSENCIAL: Se o contexto ainda está a ler o localStorage, não faz nada
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // 3. Verifica o 'user' (que é o que tu definiste no AuthProvider)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;