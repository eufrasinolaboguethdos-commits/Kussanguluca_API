import React from 'react';
import { FiLoader } from 'react-icons/fi';

const Button = ({ children, type = 'button', isLoading = false, ...props }) => {
  return (
    <button
      type={type}
      disabled={isLoading}
      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-brand-500 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 font-medium transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      {...props}
    >
      {isLoading ? <FiLoader className="animate-spin text-xl" /> : children}
    </button>
  );
};

export default Button;