import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  const novaSenha = watch('novaSenha');

  const onSubmit = async (data) => {
    setLoading(true);
    setErro('');
    try {
      await api.post('/usuarios/reset-senha', {
        email: data.email,
        novaSenha: data.novaSenha
      });
      setSucesso(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (error) {
      setErro(error.response?.data?.error || 'Email não encontrado. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="text-center animate-fade-in-up">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <FiCheckCircle className="mx-auto text-green-500" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha Alterada!</h2>
        <p className="text-gray-600 mb-4">A sua senha foi redefinida com sucesso.</p>
        <p className="text-sm text-gray-500">A redirecionar para o login...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Redefinir Senha</h2>
        <p className="text-sm text-gray-600 mt-2">
          Insira o seu email e a nova senha
        </p>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <FiAlertCircle size={20} />
          <span className="text-sm">{erro}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              message: 'Email inválido'
            }
          })}
        />

        <Input
          label="Nova Senha"
          type="password"
          placeholder="Mínimo 6 caracteres"
          icon={<FiLock className="text-gray-400" />}
          error={errors.novaSenha}
          {...register('novaSenha', {
            required: 'A nova senha é obrigatória',
            minLength: { value: 6, message: 'Mínimo 6 caracteres' }
          })}
        />

        <Input
          label="Confirmar Nova Senha"
          type="password"
          placeholder="Repita a nova senha"
          icon={<FiLock className="text-gray-400" />}
          error={errors.confirmarSenha}
          {...register('confirmarSenha', {
            required: 'Confirme a nova senha',
            validate: value => value === novaSenha || 'As senhas não coincidem'
          })}
        />

        <Button type="submit" isLoading={loading}>
          Redefinir Senha
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-medium text-brand-500 hover:text-brand-700">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;