/**
 * Skill de Gestão Financeira para MPMEs Angolanas
 * Converte dados financeiros em insights acionáveis
 */

class SkillGestaoFinanceira {
  constructor() {
    // Thresholds adaptados ao contexto angolano
    this.thresholds = {
      liquidezCorrenteMin: 1.2,
      liquidezImediataMin: 0.5,
      margemLiquidaMin: 0.05,
      roiMin: 0.10,
      pmrMax: 45,
      coberturaMinima: 3
    };

    // Cores do semáforo
    this.niveisRisco = {
      VERDE: 'verde',
      AMARELO: 'amarelo',
      VERMELHO: 'vermelho'
    };
  }

  /**
   * Método principal - processa qualquer pergunta financeira
   */
  async processarPergunta(pergunta, contextoEmpresa, dadosFinanceiros) {
    const intencao = this.classificarIntencao(pergunta);
    
    switch (intencao) {
      case 'analise_liquidez':
        return this.analisarLiquidez(dadosFinanceiros, contextoEmpresa);
      
      case 'projecao_cashflow':{
        const meses = this.extrairMeses(pergunta) || 3;
        return this.projectarCashFlow(dadosFinanceiros, meses);
      }
      case 'saude_financeira':{
        return this.avaliarSaudeFinanceira(dadosFinanceiros);
      }
      case 'alerta_divida':{
        return this.verificarSituacaoDivida(dadosFinanceiros);
      }
      case 'incentivos_fiscais':{
        return this.consultarIncentivos(contextoEmpresa);
      }
      default:{
        return this.respostaGenerica();
      }
    }
  }

  /**
   * Classifica a intenção da pergunta usando palavras-chave
   */
  classificarIntencao(pergunta) {
    const texto = pergunta.toLowerCase();
    
    const keywords = {
      analise_liquidez: ['liquidez', 'pagar', 'curto prazo', 'dinheiro', 'caixa', 'saldo'],
      projecao_cashflow: ['projetar', 'futuro', 'prever', 'cash flow', 'próximos meses', 'projecao'],
      saude_financeira: ['saúde', 'como estou', 'situação', 'análise geral', 'score'],
      alerta_divida: ['dívida', 'devo', 'credores', 'atraso', 'banco', 'emprestimo'],
      incentivos_fiscais: ['incentivo', 'imposto', 'dedução', 'iva', 'ire', 'oge']
    };

    for (const [intencao, palavras] of Object.entries(keywords)) {
      if (palavras.some(p => texto.includes(p))) {
        return intencao;
      }
    }

    return 'generica';
  }

  /**
   * Análise de liquidez com alertas contextualizados
   */
  analisarLiquidez(dados, contexto) {
    const ativoCorrente = dados.ativoCorrente || 0;
    const passivoCorrente = dados.passivoCorrente || 0;
    const disponibilidades = dados.disponibilidades || 0;

    const liquidezCorrente = passivoCorrente > 0 ? ativoCorrente / passivoCorrente : 0;
    const liquidezImediata = passivoCorrente > 0 ? disponibilidades / passivoCorrente : 0;

    const riscoCambial = (contexto.exposicaoDolar || 0) > 0.3;

    const recomendacoes = [];

    // Análise de liquidez corrente
    if (liquidezCorrente < this.thresholds.liquidezCorrenteMin) {
      recomendacoes.push({
        tipo: 'alerta',
        icone: '⚠️',
        titulo: 'Liquidez Corrente Baixa',
        descricao: `Seu índice é ${liquidezCorrente.toFixed(2)}, abaixo do recomendado (1.2). Considere renegociar prazos com fornecedores.`
      });
    }

    // Análise de liquidez imediata
    if (liquidezImediata < this.thresholds.liquidezImediataMin) {
      recomendacoes.push({
        tipo: 'critico',
        icone: '🚨',
        titulo: 'Liquidez Imediata Crítica',
        descricao: 'Priorize conversão de stock em caixa e evite novos compromissos de curto prazo.'
      });
    }

    // Alerta específico Angola - exposição cambial
    if (riscoCambial && liquidezImediata < 1.0) {
      recomendacoes.push({
        tipo: 'cambio',
        icone: '💱',
        titulo: 'Risco Cambial Elevado',
        descricao: 'Exposição significativa em USD com liquidez reduzida. Considere hedge cambial ou renegociação de contratos.'
      });
    }

    // Se está tudo bem
    if (recomendacoes.length === 0) {
      recomendacoes.push({
        tipo: 'sucesso',
        icone: '✅',
        titulo: 'Situação de Liquidez Saudável',
        descricao: 'Seus indicadores estão dentro dos parâmetros recomendados. Mantenha o monitoramento.'
      });
    }

    return {
      tipo: 'analise_liquidez',
      titulo: 'Análise de Liquidez',
      indicadores: {
        liquidezCorrente: parseFloat(liquidezCorrente.toFixed(2)),
        liquidezImediata: parseFloat(liquidezImediata.toFixed(2)),
        disponibilidades: disponibilidades
      },
      situacao: this.determinarNivelRisco(liquidezCorrente, liquidezImediata),
      recomendacoes,
      contextoAngola: {
        volatilidadeCambialAlerta: riscoCambial,
        setor: contexto.setor || 'não especificado'
      }
    };
  }

  /**
   * Projeção de cash flow com médias móveis
   */
  projectarCashFlow(historico, meses = 3) {
    const entradas = historico.entradasMensais || [];
    const saidas = historico.saidasMensais || [];

    if (entradas.length < 3) {
      return {
        erro: true,
        mensagem: 'Dados históricos insuficientes. Mínimo 3 meses.'
      };
    }

    const mediaEntradas = entradas.reduce((a, b) => a + b, 0) / entradas.length;
    const mediaSaidas = saidas.reduce((a, b) => a + b, 0) / saidas.length;
    
    // Tendência (último vs primeiro)
    const tendencia = (entradas[entradas.length - 1] - entradas[0]) / entradas.length;

    const projecoes = [];
    let saldoAcumulado = historico.saldoAtual || 0;

    for (let i = 1; i <= meses; i++) {
      const entradaProj = mediaEntradas + (tendencia * i);
      const saidaProj = mediaSaidas * 1.05; // Aumento conservador 5%
      const saldoMes = entradaProj - saidaProj;
      saldoAcumulado += saldoMes;

      const data = new Date();
      data.setMonth(data.getMonth() + i);

      projecoes.push({
        mes: data.toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' }),
        entradasPrevistas: Math.round(entradaProj),
        saidasPrevistas: Math.round(saidaProj),
        saldoMes: Math.round(saldoMes),
        saldoAcumulado: Math.round(saldoAcumulado),
        alerta: saldoAcumulado < 0
      });
    }

    const alertas = [];
    const mesesNegativos = projecoes.filter(p => p.alerta).map(p => p.mes);
    
    if (mesesNegativos.length > 0) {
      alertas.push({
        tipo: 'critico',
        icone: '🚨',
        titulo: 'Saldo Negativo Projetado',
        descricao: `Deficit previsto em: ${mesesNegativos.join(', ')}. Avalie linha de crédito ou antecipação de recebíveis.`
      });
    }

    return {
      tipo: 'projecao_cashflow',
      titulo: `Projeção de Cash Flow - ${meses} meses`,
      horizonteMeses: meses,
      projecoes,
      alertas,
      resumo: this.gerarResumoCashFlow(projecoes)
    };
  }

  /**
   * Avaliação completa de saúde financeira (score 0-100)
   */
  avaliarSaudeFinanceira(dados) {
    const indicadores = {
      liquidezImediata: dados.liquidezImediata || 0,
      liquidezCorrente: dados.liquidezCorrente || 0,
      margemLiquida: dados.margemLiquida || 0,
      roi: dados.roi || 0,
      coberturaDespesas: dados.coberturaMeses || 0
    };

    // Cálculo do score (0-100)
    let score = 0;
    score += Math.min(indicadores.liquidezCorrente * 20, 25);
    score += Math.min(indicadores.liquidezImediata * 25, 25);
    score += Math.min(indicadores.margemLiquida * 200, 20);
    score += Math.min(indicadores.roi * 100, 15);
    score += Math.min(indicadores.coberturaDespesas * 5, 15);

    let nivel, mensagem, cor;

    if (score >= 75) {
      nivel = this.niveisRisco.VERDE;
      cor = 'emerald';
      mensagem = 'Situação financeira saudável. Mantenha monitorização regular.';
    } else if (score >= 50) {
      nivel = this.niveisRisco.AMARELO;
      cor = 'amber';
      mensagem = 'Atenção necessária em alguns indicadores. Reveja recomendações.';
    } else {
      nivel = this.niveisRisco.VERMELHO;
      cor = 'rose';
      mensagem = 'Situação crítica. Recomenda-se intervenção imediata.';
    }

    return {
      tipo: 'saude_financeira',
      titulo: 'Saúde Financeira',
      score: parseFloat(score.toFixed(1)),
      nivel,
      cor,
      mensagem,
      indicadores,
      acoesPrioritarias: this.gerarAcoesPrioritarias(indicadores, nivel)
    };
  }

  // ============ MÉTODOS AUXILIARES ============

  determinarNivelRisco(liqCorr, liqImed) {
    if (liqCorr >= 1.5 && liqImed >= 1.0) return this.niveisRisco.VERDE;
    if (liqCorr >= 1.2 && liqImed >= 0.5) return this.niveisRisco.AMARELO;
    return this.niveisRisco.VERMELHO;
  }

  gerarResumoCashFlow(projecoes) {
    const ultimo = projecoes[projecoes.length - 1];
    if (ultimo.saldoAcumulado > 0) {
      return {
        tipo: 'positivo',
        texto: `Projeção positiva. Saldo acumulado estimado: ${ultimo.saldoAcumulado.toLocaleString('pt-AO')} Kz`
      };
    }
    return {
      tipo: 'negativo',
      texto: 'Projeção negativa. Necessário plano de contingência imediato.'
    };
  }

  gerarAcoesPrioritarias(indicadores, nivel) {
    const acoes = [];
    
    if (indicadores.liquidezImediata < 0.5) {
      acoes.push('Negociar pagamentos diferidos com fornecedores chave');
      acoes.push('Acelerar cobranças com desconto por pronto pagamento');
    }
    
    if (indicadores.margemLiquida < 0.05) {
      acoes.push('Reavaliar preços de venda');
      acoes.push('Negociar condições com fornecedores');
    }

    if (nivel === this.niveisRisco.VERMELHO) {
      acoes.push('Consultar contabilista certificado urgentemente');
    }

    return acoes;
  }

  verificarSituacaoDivida(dados) {
    const passivoTotal = dados.passivoTotal || 0;
    const ativoTotal = dados.ativoTotal || 1;
    const endividamento = passivoTotal / ativoTotal;

    return {
      tipo: 'alerta_divida',
      titulo: 'Análise de Endividamento',
      racioEndividamento: parseFloat(endividamento.toFixed(2)),
      nivelRisco: endividamento > 0.6 ? 'elevado' : endividamento > 0.4 ? 'moderado' : 'baixo',
      recomendacao: endividamento > 0.6 
        ? 'Reestruturar dívidas de curto prazo prioritariamente' 
        : 'Manter monitorização regular'
    };
  }

  consultarIncentivos(contexto) {
    const incentivos = {
      industrial: { iva: 0.70, ire: 0.50, descricao: 'Dedução de 70% do IVA, redução de 50% do IRE' },
      agricola: { ire: 0.50, descricao: 'Redução de 50% do IRE' },
      tecnologico: { ire: 0.25, descricao: 'Redução de 25% do IRE' }
    };

    const setor = contexto.setor || 'industrial';
    const incentivo = incentivos[setor] || incentivos.industrial;

    return {
      tipo: 'incentivos_fiscais',
      titulo: 'Incentivos Fiscais OGE 2025',
      setor,
      incentivos: incentivo,
      nota: 'Consulte contabilista certificado para requerimento formal'
    };
  }

  respostaGenerica() {
    return {
      tipo: 'generica',
      titulo: 'Assistente Financeiro',
      mensagem: 'Posso ajudar com análise de liquidez, projeção de cash flow, avaliação de saúde financeira ou informações sobre incentivos fiscais em Angola.',
      sugestoes: [
        'Qual a minha situação de liquidez?',
        'Projete meu cash flow para os próximos 6 meses',
        'Como está a saúde financeira da minha empresa?',
        'Quais incentivos fiscais posso aproveitar?'
      ]
    };
  }

  extrairMeses(pergunta) {
    const match = pergunta.match(/(\d+)\s*(?:mes|mês)/i);
    return match ? parseInt(match[1]) : null;
  }
}

export default SkillGestaoFinanceira;