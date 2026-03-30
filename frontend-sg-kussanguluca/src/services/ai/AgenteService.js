/**
 * AgenteService.js v2
 * Orquestrador com pipeline de segurança obrigatório e NLP melhorado
 */

import SkillManager from './SkillManager';
import SkillCybersecurity from './SkillCybersecurity';

// ── NLP com intent scoring ──────────────────────────────────
const INTENTS = [
  {
    name: 'analise_liquidez',
    keywords: ['liquidez', 'pagar', 'curto prazo', 'dinheiro', 'caixa', 'saldo', 'disponível'],
    weight: 1.0,
  },
  {
    name: 'projecao_cashflow',
    keywords: ['projetar', 'futuro', 'prever', 'cash flow', 'próximos meses', 'projecao', 'previsão'],
    weight: 1.0,
  },
  {
    name: 'saude_financeira',
    keywords: ['saúde', 'saude', 'como estou', 'situação', 'análise geral', 'score', 'diagnóstico'],
    weight: 1.0,
  },
  {
    name: 'alerta_divida',
    keywords: ['dívida', 'divida', 'devo', 'credores', 'atraso', 'banco', 'emprestimo'],
    weight: 1.0,
  },
  {
    name: 'incentivos_fiscais',
    keywords: ['incentivo', 'imposto', 'dedução', 'iva', 'ire', 'oge', 'fiscal'],
    weight: 1.0,
  },
  {
    name: 'saudacao',
    keywords: ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hello'],
    weight: 0.8,
  },
  {
    name: 'analise_codigo',
    keywords: ['analisa', 'verifica', 'scan', 'código', 'codigo', 'segurança', 'vulnerabilidade'],
    weight: 1.2, // Alta prioridade para scan de segurança
  },
];

function scoreIntent(texto) {
  const lower = texto.toLowerCase();
  const scores = INTENTS.map(intent => {
    const matches = intent.keywords.filter(k => lower.includes(k)).length;
    return { name: intent.name, score: matches * intent.weight };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.score > 0 ? scores[0].name : 'desconhecida';
}

function extractEntities(texto) {
  const entities = {};

  const mesesMatch = texto.match(/(\d+)\s*(?:mes|mês)/i);
  if (mesesMatch) entities.meses = parseInt(mesesMatch[1]);

  const valorMatch = texto.match(/(\d[\d.,]*)\s*(?:kz|kwanza|aoa)/i);
  if (valorMatch) entities.valor = parseFloat(valorMatch[1].replace(',', '.'));

  const setorMatch = texto.match(/\b(comercio|indústria|industria|tecnologia|agricultura|servicos)\b/i);
  if (setorMatch) entities.setor = setorMatch[1].toLowerCase();

  return entities;
}

// ── Cache simples ───────────────────────────────────────────
const responseCache = new Map();
const CACHE_TTL = 30_000;

function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  responseCache.set(key, { data, ts: Date.now() });
  if (responseCache.size > 50) {
    // LRU simples — remove a entrada mais antiga
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
}

// ── Serviço Principal ───────────────────────────────────────
class AgenteService {
  constructor() {
    this.historico = [];
    this.maxHistorico = 20;
  }

  /**
   * Ponto de entrada principal
   * Pipeline: Input → Preprocess → Intent → Skills → Security → Format → Output
   */
  async processarMensagem(mensagem, contextoEmpresa = {}, dadosFinanceiros = {}) {
    try {
      // 1. Pré-processar
      const texto = this._preprocess(mensagem);

      // 2. Cache
      const cacheKey = `${texto}_${contextoEmpresa?.id || ''}`;
      const cached = getCached(cacheKey);
      if (cached) return { ...cached, fromCache: true };

      // 3. Intent scoring + entity extraction
      const intent = scoreIntent(texto);
      const entities = extractEntities(texto);

      // 4. Scan de código se for pedido de análise
      if (intent === 'analise_codigo' && dadosFinanceiros?.codeToAnalyze) {
        return this._handleCodeScan(dadosFinanceiros.codeToAnalyze);
      }

      // 5. Executar pipeline de skills
      const resultado = await SkillManager.execute(texto, contextoEmpresa, {
        ...dadosFinanceiros,
        _intent: intent,
        _entities: entities,
      });

      // 6. Formatar para UI
      const formatted = this._formatForUI(resultado, intent, entities);

      // 7. Cache e histórico
      setCache(cacheKey, formatted);
      this._addToHistory(mensagem, formatted);

      return formatted;

    } catch (err) {
      console.error('[AgenteService] Erro:', err);
      return this._errorResponse();
    }
  }

  /**
   * Scan directo de código (exposto para UI)
   */
  scanCode(code) {
    if (!code) return SkillCybersecurity._emptyResult();
    return SkillCybersecurity.scan(code);
  }

  /**
   * Histórico de conversa
   */
  getHistorico() {
    return this.historico.slice(-this.maxHistorico);
  }

  limparHistorico() {
    this.historico = [];
    responseCache.clear();
  }

  // ── PRIVATE ───────────────────────────────────────────────

  _preprocess(texto) {
    return texto.trim().replace(/\s+/g, ' ').substring(0, 500); // Max 500 chars
  }

  _handleCodeScan(code) {
    const scan = SkillCybersecurity.scan(code);
    return {
      id: Date.now(),
      tipo: 'code_scan',
      titulo: 'Análise de Segurança',
      conteudo: {
        tipo: 'code_scan',
        titulo: 'Análise de Segurança do Código',
        scan,
        mensagem: scan.summary.message,
      },
      _security: scan,
      secureMode: true,
      timestamp: new Date(),
      sugestoes: scan.vulnerabilities.length > 0
        ? ['Ver vulnerabilidades', 'Aplicar correcções', 'Ver código seguro']
        : ['Analisar outro código', 'Ver saúde financeira'],
    };
  }

  _formatForUI(resultado, intent, entities) {
    const security = resultado._security || { riskLevel: 'low', summary: { clean: true } };
    const hasSecurityIssues = security.vulnerabilities?.length > 0;

    return {
      id: Date.now(),
      tipo: resultado.tipo || intent,
      titulo: resultado.titulo || 'Resposta',
      conteudo: resultado,
      timestamp: new Date(),
      sugestoes: resultado.sugestoes || this._defaultSugestoes(resultado.tipo),
      // Security metadata para UI
      _security: {
        riskLevel: security.riskLevel,
        clean: security.summary?.clean,
        message: security.summary?.message,
        hasIssues: hasSecurityIssues,
        blocked: resultado._securityBlocked || false,
        vulnerabilityCount: security.vulnerabilities?.length || 0,
      },
      _intent: intent,
      _entities: entities,
    };
  }

  _defaultSugestoes(tipo) {
    const map = {
      analise_liquidez: ['Projetar cash flow', 'Ver saúde financeira'],
      projecao_cashflow: ['Análise de liquidez', 'Ver dívidas'],
      saude_financeira: ['Detalhar indicadores', 'Projeção futura'],
      saudacao: ['Analisar liquidez', 'Ver saúde financeira', 'Projetar receitas'],
    };
    return map[tipo] || ['Analisar liquidez', 'Projetar cash flow', 'Saúde financeira'];
  }

  _addToHistory(pergunta, resposta) {
    this.historico.push({ pergunta, resposta, ts: new Date() });
    if (this.historico.length > this.maxHistorico) {
      this.historico.shift();
    }
  }

  _errorResponse() {
    return {
      id: Date.now(),
      tipo: 'erro',
      titulo: 'Erro',
      conteudo: { tipo: 'erro', mensagem: 'Erro ao processar. Tente novamente.' },
      timestamp: new Date(),
      sugestoes: ['Tentar novamente'],
      _security: { riskLevel: 'low', clean: true },
    };
  }
}

export default new AgenteService();