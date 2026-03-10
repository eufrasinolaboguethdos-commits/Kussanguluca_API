import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setLoginError('');
    
    try {
      await signIn(data);
      //console.log("LOGIN RESPONSE:", response);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError(
        error.response?.data?.message || 
        'Email ou senha incorretos. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Seja Bem-Vindo!</h2>
        <p className="text-sm text-gray-600 mt-2">Acede à tua conta S.G Kussanguluca</p>
      </div>

      {loginError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <FiAlertCircle size={20} />
          <span className="text-sm">{loginError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          placeholder="exemplo@email.com"
          error={errors.email}
          {...register('email', {
            required: 'O email é obrigatório',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Endereço de email inválido'
            }
          })}
        />

        <Input
          label="Palavra-passe"
          type="password"
          placeholder="********"
          error={errors.senha}
          {...register('senha', {
            required: 'A palavra-passe é obrigatória',
            minLength: { value: 6, message: 'Mínimo de 6 caracteres' }
          })}
        />

        <div className="flex items-center justify-between mb-6 text-sm">
          <label className="flex items-center text-gray-600 cursor-pointer">
             <input type="checkbox" className="mr-2 rounded text-brand-500 focus:ring-brand-500" />
             Lembrar-me
          </label>
          <a href="#" className="font-medium text-brand-500 hover:text-brand-700">
            Esqueceu a senha?
          </a>
        </div>

        <Button type="submit" isLoading={isLoading}>
          Entrar
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Ainda não tens conta?{' '}
        <Link to="/register" className="font-medium text-brand-500 hover:text-brand-700">
          Regista-te gratuitamente
        </Link>
      </p>
    </div>
  );
};

export default Login;