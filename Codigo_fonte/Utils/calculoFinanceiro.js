// ============================================================
// Utils/calculoFinanceiro.js
// Funções de cálculo financeiro da plataforma
// ============================================================

export function calcularResumoFinanceiro(receitas = [], despesas = []) {
  const totalReceitas = receitas.reduce((total, r) => total + Number(r.valor), 0);
  const totalDespesas = despesas.reduce((total, d) => total + Number(d.valor), 0);
  const fluxoCaixa = totalReceitas - totalDespesas;

  const margemLucro = totalReceitas > 0
    ? ((fluxoCaixa / totalReceitas) * 100).toFixed(2)
    : 0;

  const situacao =
    fluxoCaixa > 0 ? "Lucro" :
    fluxoCaixa < 0 ? "Prejuízo" : "Equilibrado";

  return {
    totalReceitas,
    totalDespesas,
    fluxoCaixa,
    margemLucro: Number(margemLucro),
    situacao
  };
}

// ── Saúde Financeira ─────────────────────────────────────────

export function calcularSaudeFinanceira(totalReceitas, totalDespesas) {
  const saldo = totalReceitas - totalDespesas;
  const racaoDespesa = totalReceitas > 0
    ? ((totalDespesas / totalReceitas) * 100)
    : 100;

  const margemLucro = totalReceitas > 0
    ? ((saldo / totalReceitas) * 100)
    : 0;

  // Nível do semáforo
  let nivel = 'verde';
  if (saldo < 0 || racaoDespesa > 80) {
    nivel = 'vermelho';
  } else if (racaoDespesa >= 60) {
    nivel = 'amarelo';
  }

  // Pontuação 0-100
  let pontuacao = 100;
  if (racaoDespesa > 80)       pontuacao = 20;
  else if (racaoDespesa > 60)  pontuacao = 50;
  else if (racaoDespesa > 40)  pontuacao = 75;
  if (saldo < 0)               pontuacao = Math.min(pontuacao, 10);

  // Texto de análise automática
  let analise_texto = '';
  if (nivel === 'verde') {
    analise_texto = `A situação financeira da empresa é positiva. O saldo líquido é favorável e as despesas representam ${racaoDespesa.toFixed(1)}% das receitas, dentro de limites saudáveis. Recomenda-se manter a disciplina financeira e considerar investimentos para crescimento.`;
  } else if (nivel === 'amarelo') {
    analise_texto = `A situação financeira requer atenção. As despesas representam ${racaoDespesa.toFixed(1)}% das receitas, aproximando-se do limite de 80%. Recomenda-se rever as categorias de maior gasto e procurar formas de aumentar as receitas nos próximos meses.`;
  } else {
    analise_texto = `ALERTA CRÍTICO: A situação financeira da empresa apresenta risco elevado. ${saldo < 0 ? 'O saldo é negativo, indicando prejuízo no período.' : ''} As despesas representam ${racaoDespesa.toFixed(1)}% das receitas. É urgente rever os gastos, renegociar compromissos e procurar novas fontes de receita.`;
  }

  return {
    saldo,
    racaoDespesa: Number(racaoDespesa.toFixed(2)),
    margemLucro: Number(margemLucro.toFixed(2)),
    nivel,
    pontuacao,
    analise_texto
  };
}

// ── Projecção de Fluxo de Caixa ──────────────────────────────

export function calcularProjecaoFluxo(receitas = [], despesas = [], mesesFuturos = 3) {
  // Agrupa por mês os últimos 3 meses
  const mapaReceitas = {};
  const mapaDespesas = {};

  receitas.forEach(r => {
    const chave = r.data ? r.data.toString().substring(0, 7) : null;
    if (chave) mapaReceitas[chave] = (mapaReceitas[chave] || 0) + Number(r.valor);
  });

  despesas.forEach(d => {
    const chave = d.data ? d.data.toString().substring(0, 7) : null;
    if (chave) mapaDespesas[chave] = (mapaDespesas[chave] || 0) + Number(d.valor);
  });

  const valoresReceita = Object.values(mapaReceitas);
  const valoresDespesa = Object.values(mapaDespesas);

  const mediaReceita = valoresReceita.length > 0
    ? valoresReceita.reduce((a, b) => a + b, 0) / valoresReceita.length
    : 0;

  const mediaDespesa = valoresDespesa.length > 0
    ? valoresDespesa.reduce((a, b) => a + b, 0) / valoresDespesa.length
    : 0;

  // Gera projecção para os próximos N meses
  const projecao = [];
  const hoje = new Date();

  for (let i = 1; i <= mesesFuturos; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');

    projecao.push({
      mes: `${ano}-${mes}`,
      receita_prevista: Number(mediaReceita.toFixed(2)),
      despesa_prevista: Number(mediaDespesa.toFixed(2)),
      saldo_previsto: Number((mediaReceita - mediaDespesa).toFixed(2)),
      base_calculo: `media_${valoresReceita.length}_meses`
    });
  }

  return {
    mediaReceita: Number(mediaReceita.toFixed(2)),
    mediaDespesa: Number(mediaDespesa.toFixed(2)),
    projecao,
    alertaNegativo: projecao.some(p => p.saldo_previsto < 0)
  };
}

// ── Progresso de Metas ───────────────────────────────────────

export function calcularProgressoMeta(meta, receitaRealizada, despesaRealizada) {
  const progressoReceita = meta.meta_receita > 0
    ? Number(((receitaRealizada / meta.meta_receita) * 100).toFixed(2))
    : 0;

  const progressoDespesa = meta.meta_despesa_max > 0
    ? Number(((despesaRealizada / meta.meta_despesa_max) * 100).toFixed(2))
    : 0;

  let estado = 'em_curso';
  if (progressoReceita >= 100) estado = 'meta_atingida';
  else if (new Date() > new Date(meta.ano, meta.mes, 0) && progressoReceita < 100) {
    estado = 'meta_falhada';
  }

  return {
    progressoReceita,
    progressoDespesa,
    estado,
    alertaDespesa: progressoDespesa >= 90,
    metaReceitaAtingida: progressoReceita >= 100
  };
}