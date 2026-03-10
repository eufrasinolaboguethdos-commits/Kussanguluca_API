import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = () => {
  const { signed } = useAuth();

  // Se não estiver logado, redireciona para o login
  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado, mostra o layout principal da app (AppLayout)
  return <Outlet />;
};

export default PrivateRoute;