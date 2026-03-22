// ============================================================
// services/notificacaoService.js
// Agrega notificações de todos os módulos da plataforma
// ============================================================
import { api } from './api';

export const notificacaoService = {
  async obterTodas(id_empresa) {
    const notificacoes = [];

    try {
      // 1. Contas prestes a vencer (3 dias) e vencidas
      const contas = await api.get('/contas', { params: { id_empresa, estado: 'pendente' } }).then(r => r.data).catch(() => []);
      const hoje = new Date();
      const em3Dias = new Date(); em3Dias.setDate(hoje.getDate() + 3);

      contas.forEach(c => {
        const venc = new Date(c.data_vencimento);
        if (c.estado === 'vencido' || venc < hoje) {
          notificacoes.push({
            id: `conta-vencida-${c.id_conta}`,
            tipo: 'erro',
            titulo: 'Conta Vencida',
            mensagem: `"${c.descricao}" venceu em ${new Date(c.data_vencimento).toLocaleDateString('pt-PT')}`,
            link: '/contas',
            icone: 'alerta'
          });
        } else if (venc <= em3Dias) {
          notificacoes.push({
            id: `conta-vence-${c.id_conta}`,
            tipo: 'aviso',
            titulo: 'Conta a Vencer',
            mensagem: `"${c.descricao}" vence em ${venc.toLocaleDateString('pt-PT')} — ${formatarValor(c.valor)}`,
            link: '/contas',
            icone: 'relogio'
          });
        }
      });
    } catch {/* ignorar erro */}

    try {
      // 2. Saúde financeira
      const saude = await api.get('/saude', { params: { id_empresa } }).then(r => r.data).catch(() => null);
      if (saude) {
        if (saude.nivel === 'vermelho') {
          notificacoes.push({
            id: 'saude-vermelho',
            tipo: 'erro',
            titulo: 'Situação Financeira Crítica',
            mensagem: `Saldo negativo ou despesas acima de 80% das receitas. Pontuação: ${saude.pontuacao}/100`,
            link: '/saude',
            icone: 'escudo'
          });
        } else if (saude.nivel === 'amarelo') {
          notificacoes.push({
            id: 'saude-amarelo',
            tipo: 'aviso',
            titulo: 'Atenção à Saúde Financeira',
            mensagem: `Despesas representam ${saude.racaoDespesa}% das receitas. Pontuação: ${saude.pontuacao}/100`,
            link: '/saude',
            icone: 'escudo'
          });
        }
      }
    } catch {/* ignorar erro */}

    try {
      // 3. Meta do mês
      const meta = await api.get('/metas/actual', { params: { id_empresa } }).then(r => r.data).catch(() => null);
      if (meta?.existe) {
        if (meta.metaReceitaAtingida) {
          notificacoes.push({
            id: 'meta-atingida',
            tipo: 'sucesso',
            titulo: '🎉 Meta Atingida!',
            mensagem: `Atingiste ${meta.progressoReceita?.toFixed(0)}% da meta de receita deste mês!`,
            link: '/metas',
            icone: 'alvo'
          });
        } else if (meta.alertaDespesa) {
          notificacoes.push({
            id: 'meta-despesa',
            tipo: 'aviso',
            titulo: 'Limite de Despesa Próximo',
            mensagem: `Já usaste ${meta.progressoDespesa?.toFixed(0)}% do limite de despesas deste mês`,
            link: '/metas',
            icone: 'alvo'
          });
        }
      }
    } catch {/* ignorar erro */}

    try {
      // 4. Fluxo de caixa negativo previsto
      const fluxo = await api.get('/fluxo', { params: { id_empresa } }).then(r => r.data).catch(() => null);
      if (fluxo?.alertaNegativo) {
        notificacoes.push({
          id: 'fluxo-negativo',
          tipo: 'aviso',
          titulo: 'Projecção de Saldo Negativo',
          mensagem: 'A projecção indica saldo negativo nos próximos meses. Reveja as despesas.',
          link: '/fluxo',
          icone: 'grafico'
        });
      }
    } catch {/* ignorar erro */}

    // 5. Resumo de contas a pagar/receber
    try {
      const resumo = await api.get('/contas/resumo', { params: { id_empresa } }).then(r => r.data).catch(() => null);
      if (resumo?.total_vencido > 0) {
        notificacoes.push({
          id: 'contas-vencidas-resumo',
          tipo: 'erro',
          titulo: 'Contas em Atraso',
          mensagem: `Total em atraso: ${formatarValor(resumo.total_vencido)}`,
          link: '/contas',
          icone: 'alerta'
        });
      }
      if (resumo?.total_receber > 0 && resumo?.qtd_pendentes > 0) {
        notificacoes.push({
          id: 'contas-receber',
          tipo: 'info',
          titulo: 'Valores a Receber',
          mensagem: `Tens ${formatarValor(resumo.total_receber)} por receber de clientes`,
          link: '/contas',
          icone: 'dinheiro'
        });
      }
    } catch {/* ignorar erro */}

    // Remove duplicados por ID
    const unicas = notificacoes.filter((n, i, arr) => arr.findIndex(x => x.id === n.id) === i);

    // Ordenação: erros primeiro, depois avisos, depois resto
    const prioridade = { erro: 0, aviso: 1, sucesso: 2, info: 3 };
    return unicas.sort((a, b) => (prioridade[a.tipo] || 9) - (prioridade[b.tipo] || 9));
  }
};

function formatarValor(v) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);
}