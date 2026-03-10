import React from 'react';
import { useAuth } from "../../../hooks/useAuth";
import { FiLogOut, FiUser } from 'react-icons/fi';

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 fixed top-0 right-0 left-0 lg:left-64 z-10 transition-all duration-300">
        <h2 className="text-xl font-semibold text-gray-800">
          {/* Aqui podemos mudar o título dinamicamente depois */}
          Visão Geral
        </h2>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-gray-600">
             <FiUser className="bg-gray-100 p-2 rounded-full text-4xl" />
             {/* Mostra o nome do utilizador logado */}
             <span className="font-medium hidden md:block">{user?.nome || 'Utilizador'}</span>
           </div>
           <button 
             onClick={signOut} 
             className="text-gray-500 hover:text-red-600 transition duration-200 p-2"
             title="Sair"
           >
             <FiLogOut size={20}/>
           </button>
        </div>
    </header>
  );
};

export default Navbar;