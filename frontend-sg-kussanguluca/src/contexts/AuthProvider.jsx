import React, { useState, useEffect } from "react";
import axios from "axios";
import authService from "../services/authService";
import AuthContext from "./AuthContext";
import api from "../services/api";

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [activeCompany, setActiveCompanyState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const initAuth = () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedCompany = localStorage.getItem("activeCompany");
    const clearStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
};


    if (!token || !savedUser) {
      clearStorage();
      setLoading(false);
      return;
    }

    try {

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (savedCompany) {

        const parsedCompany = JSON.parse(savedCompany);

        if (parsedCompany && parsedCompany.id_empresa) {
          setActiveCompanyState(parsedCompany);
          axios.defaults.headers.common["X-Company-ID"] = parsedCompany.id_empresa;
        } else {
          localStorage.removeItem("activeCompany");
        }

      }

    } catch (error) {

      console.error("Erro ao restaurar sessão:", error);
      clearStorage();

    } finally {
      setLoading(false);
    } 
  };
    initAuth();

  }, []);

  const signIn = async ({ email, senha }) => {

    try {

      const response = await authService.login({ email, senha });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${response.token}`;
      api.defaults.headers.common["Authorization"] = `Bearer ${response.token}`;

      setUser(response.user);

      if (response.empresas) {
        localStorage.setItem("userCompanies", JSON.stringify(response.empresas));
      }

      return response;

    } catch (error) {

      console.error("Erro no login:", error);
      throw error;

    }

  };

  const setActiveCompany = (company) => {

    if (!company || !company.id_empresa) {

      setActiveCompanyState(null);
      localStorage.removeItem("activeCompany");
      delete axios.defaults.headers.common["X-Company-ID"];
      return;

    }

    setActiveCompanyState(company);

    localStorage.setItem("activeCompany", JSON.stringify(company));

    axios.defaults.headers.common["X-Company-ID"] = company.id_empresa;

  };

  const clearStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeCompany");
    localStorage.removeItem("userCompanies");
    localStorage.removeItem("activeCompanyId"); // ✅ limpa o do useCompanyId também
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["X-Company-ID"];
};

  const logout = () => {

    clearStorage();

    setUser(null);
    setActiveCompanyState(null);

  };

  const value = {
    user, setUser, activeCompany, setActiveCompany,
    signIn, logout, signOut: logout, // ✅ alias para o Navbar funcionar
    loading, isAuthenticated: !!user
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};

export default AuthProvider;