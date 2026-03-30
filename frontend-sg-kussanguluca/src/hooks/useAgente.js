/**
 * Hook customizado para usar o Agente de IA em componentes React
 */

import { useState, useCallback } from 'react';
import agenteService from '../services/ai/AgenteService';

export const useAgente = () => {
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  /**
   * Envia mensagem para o agente e processa resposta
   */
  const enviarMensagem = useCallback(async (texto, contextoEmpresa, dadosFinanceiros) => {
    if (!texto.trim()) return;

    setCarregando(true);
    setErro(null);

    // Adiciona mensagem do usuário ao histórico
    const msgUsuario = {
      id: Date.now(),
      tipo: 'usuario',
      texto: texto,
      timestamp: new Date()
    };

    setMensagens(prev => [...prev, msgUsuario]);

    try {
      // Processa no agente
      const resposta = await agenteService.processarMensagem(
        texto,
        contextoEmpresa,
        dadosFinanceiros
      );

      // Adiciona resposta do agente
      const msgAgente = {
        id: Date.now() + 1,
        tipo: 'agente',
        ...resposta
      };

      setMensagens(prev => [...prev, msgAgente]);

    } catch (err) {
      setErro('Erro ao processar mensagem');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Limpa histórico de conversas
   */
  const limparConversa = useCallback(() => {
    setMensagens([]);
    agenteService.limparHistorico();
  }, []);

  /**
   * Inicia conversa com saudação
   */
  const iniciarConversa = useCallback(async (contextoEmpresa, dadosFinanceiros) => {
    await enviarMensagem('olá', contextoEmpresa, dadosFinanceiros);
  }, [enviarMensagem]);

  return {
    mensagens,
    carregando,
    erro,
    enviarMensagem,
    limparConversa,
    iniciarConversa
  };
};

export default useAgente;