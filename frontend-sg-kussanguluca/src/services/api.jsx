import axios from 'axios';

// Criar instância do axios com configuração base
export const api = axios.create({
  baseURL: 'http://localhost:3000', // URL do teu backend
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// INTERCEPTOR DE REQUEST (antes de enviar)
api.interceptors.request.use(
  (config) => {
    // Pegar token do localStorage
    const token = localStorage.getItem('token');
    
    // Se existe token, adicionar ao header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token adicionado ao request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erro no request:', error);
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPONSE (quando recebe resposta)
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta OK:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta:', error.response?.status, error.response?.data);
    
    // Se erro 401 (não autorizado), fazer logout
    if (error.response?.status === 401) {
  // Só faz logout se NÃO for a rota de login
  const isLoginRequest = error.config?.url?.includes('/login');
  if (!isLoginRequest) {
    console.log('🚫 Token inválido ou expirado. Fazendo logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
    
    // Se erro 500, mostrar mensagem genérica
    if (error.response?.status === 500) {
      error.message = 'Erro no servidor. Tente novamente mais tarde.';
    }
    
    return Promise.reject(error);
  }
);

export default api;