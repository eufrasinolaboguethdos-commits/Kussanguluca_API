import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiAlertCircle, FiCheckCircle, FiUser, FiMail, FiLock } from 'react-icons/fi';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setRegisterError('');
    
    try {
      const { ...userData } = data;
      
      // Apenas dados do utilizador - sem empresa!
      await authService.register({
        nome: userData.nome,
        email: userData.email,
        password: userData.password
      });
      
      setRegisterSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Erro no registo:', error);
      setRegisterError(
        error.response?.data?.message || 
        'Erro ao criar conta. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (registerSuccess) {
    return (
      <div className="text-center animate-fade-in-up">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <FiCheckCircle className="mx-auto text-green-500" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Criada!</h2>
        <p className="text-gray-600 mb-4">
          O seu registo foi realizado com sucesso.
        </p>
        <p className="text-sm text-gray-500">
          A redirecionar para o login...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
        <p className="text-sm text-gray-600 mt-2">
          Registe-se para começar a gerir as suas finanças
        </p>
      </div>

      {registerError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <FiAlertCircle size={20} />
          <span className="text-sm">{registerError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome Completo"
          placeholder="Ex: João Silva"
          icon={<FiUser className="text-gray-400" />}
          error={errors.nome}
          {...register('nome', {
            required: 'O nome é obrigatório',
            minLength: { value: 3, message: 'Mínimo de 3 caracteres' }
          })}
        />

        <Input
          label="Email"
          type="email"
          placeholder="exemplo@email.com"
          icon={<FiMail className="text-gray-400" />}
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
          placeholder="Mínimo 6 caracteres"
          icon={<FiLock className="text-gray-400" />}
          error={errors.password}
          {...register('password', {
            required: 'A palavra-passe é obrigatória',
            minLength: { value: 6, message: 'Mínimo de 6 caracteres' }
          })}
        />

        <Input
          label="Confirmar Palavra-passe"
          type="password"
          placeholder="Repita a palavra-passe"
          icon={<FiLock className="text-gray-400" />}
          error={errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Confirme a palavra-passe',
            validate: value => value === password || 'As palavras-passe não coincidem'
          })}
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="termos"
            className="mt-1 rounded text-brand-500 focus:ring-brand-500"
            {...register('termos', { required: 'Deve aceitar os termos' })}
          />
          <label htmlFor="termos" className="text-sm text-gray-600">
            Aceito os{' '}
            <Link to="/termos" className="text-brand-500 hover:text-brand-700 underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link to="/privacidade" className="text-brand-500 hover:text-brand-700 underline">
               Política de Privacidade
            </Link>
          </label>
        </div>
        {errors.termos && (
          <p className="text-sm text-red-600">{errors.termos.message}</p>
        )}

        <Button type="submit" isLoading={isLoading}>
          Criar Conta
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Já tem uma conta?{' '}
        <Link to="/login" className="font-medium text-brand-500 hover:text-brand-700">
          Inicie sessão aqui
        </Link>
      </p>
    </div>
  );
};

export default Register;