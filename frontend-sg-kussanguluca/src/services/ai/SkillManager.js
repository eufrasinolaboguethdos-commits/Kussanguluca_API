/**
 * SkillManager.js
 * Orquestra skills em pipeline, enforce security como middleware obrigatório
 */

import SkillCybersecurity from './SkillCybersecurity';
import SkillGestaoFinanceira from './SkillGestaoFinanceira';

class SkillManager {
  constructor() {
    this._skills = new Map();
    this._pipeline = [];
    this._securityEnabled = true;

    // Regista skills built-in
    this.register('financeira', new SkillGestaoFinanceira(), {
      triggers: ['liquidez', 'cash', 'dinheiro', 'divida', 'imposto', 'saude', 'score', 'projetar', 'receita', 'despesa'],
      priority: 1,
    });

    // Security é sempre o último no pipeline (middleware)
    this.register('cybersecurity', SkillCybersecurity, {
      triggers: ['*'], // corre sempre
      priority: 99,
      isSecurity: true,
    });
  }

  /**
   * Regista uma nova skill
   */
  register(name, instance, options = {}) {
    this._skills.set(name, { instance, options });
    return this;
  }

  /**
   * Remove skill
   */
  unregister(name) {
    if (name === 'cybersecurity') {
      console.warn('[SkillManager] Não é possível remover a skill de segurança.');
      return this;
    }
    this._skills.delete(name);
    return this;
  }

  /**
   * Executa o pipeline para uma mensagem
   * Fluxo: Input → Match Skills → Execute → Security Scan → Output
   */
  async execute(mensagem, contexto, dados) {
    const texto = mensagem.toLowerCase().trim();
    const matchedSkills = this._matchSkills(texto);

    let resultado = null;

    // Executa skills correspondentes por prioridade
    for (const { name, skill } of matchedSkills) {
      if (skill.options.isSecurity) continue; // Security corre depois

      try {
        resultado = await skill.instance.processarPergunta(mensagem, contexto, dados);
        resultado._skill = name;
        break; // Usa a primeira skill que corresponde
      } catch (err) {
        console.error(`[SkillManager] Erro na skill "${name}":`, err);
      }
    }

    if (!resultado) {
      resultado = this._fallbackResult(mensagem);
    }

    // SECURITY MIDDLEWARE — sempre executa no final
    if (this._securityEnabled) {
      resultado = this._runSecurityMiddleware(resultado);
    }

    return resultado;
  }

  /**
   * Scan de segurança directo (sem pipeline completo)
   */
  scanCode(code) {
    return SkillCybersecurity.scan(code);
  }

  /**
   * Lista skills registadas
   */
  listSkills() {
    return Array.from(this._skills.entries()).map(([name, { options }]) => ({
      name,
      triggers: options.triggers,
      priority: options.priority,
      isSecurity: options.isSecurity || false,
    }));
  }

  // ── PRIVATE ─────────────────────────────────────────────

  _matchSkills(texto) {
    const matched = [];

    for (const [name, skill] of this._skills.entries()) {
      const triggers = skill.options.triggers || [];
      const isWildcard = triggers.includes('*');
      const matches = isWildcard || triggers.some(t => texto.includes(t));

      if (matches) {
        matched.push({ name, skill });
      }
    }

    // Ordena por prioridade (menor número = maior prioridade)
    return matched.sort((a, b) => (a.skill.options.priority || 0) - (b.skill.options.priority || 0));
  }

  _runSecurityMiddleware(resultado) {
    // Verifica código no resultado
    const codeToScan = resultado.secureCode || resultado.code || resultado.snippet;

    if (codeToScan) {
      const scan = SkillCybersecurity.scan(codeToScan);
      resultado._security = scan;

      if (scan.blocked) {
        resultado.secureCode = scan.secureCode;
        resultado._securityBlocked = true;
      }
    }

    // Sempre adiciona metadata de segurança
    if (!resultado._security) {
      resultado._security = {
        riskLevel: 'low',
        summary: { clean: true, message: 'Sem código para verificar.' },
      };
    }

    return resultado;
  }

  _fallbackResult() {
    return {
      tipo: 'fallback',
      titulo: 'Assistente Financeiro',
      mensagem: 'Posso ajudar com análise de liquidez, projeção de cash flow, saúde financeira e incentivos fiscais.',
      sugestoes: [
        'Qual a minha situação de liquidez?',
        'Projete o cash flow para 3 meses',
        'Como está a saúde financeira?',
      ],
      _skill: 'fallback',
    };
  }
}

// Singleton
export default new SkillManager();