/**
 * SkillCybersecurity.js
 * OWASP Top 10 scanner + auto-fix engine
 * Runs as mandatory middleware on every code operation
 */

const VULNERABILITY_PATTERNS = [
  {
    id: 'XSS_INNERHTML',
    type: 'XSS',
    severity: 'high',
    pattern: /\.innerHTML\s*=\s*[^`'"]/g,
    message: 'innerHTML com input dinâmico — risco de XSS',
    fix: (code) => code.replace(/\.innerHTML\s*=\s*(\w+)/g, '.textContent = $1'),
  },
  {
    id: 'XSS_DANGEROUSLY',
    type: 'XSS',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML/g,
    message: 'dangerouslySetInnerHTML detectado — sanitize com DOMPurify',
    fix: null,
  },
  {
    id: 'SQL_INJECTION',
    type: 'SQLi',
    severity: 'critical',
    pattern: /`[^`]*\$\{[^}]+\}[^`]*`\s*(?:WHERE|SELECT|INSERT|UPDATE|DELETE|FROM)/gi,
    message: 'Template literal em query SQL — usa prepared statements',
    fix: null,
  },
  {
    id: 'SQL_CONCAT',
    type: 'SQLi',
    severity: 'critical',
    pattern: /(?:query|sql|execute)\s*\([^)]*\+\s*(?:req\.|res\.|body\.|params\.|query\.)/gi,
    message: 'Concatenação de input em SQL — usa parâmetros (?, $1)',
    fix: null,
  },
  {
    id: 'HARDCODED_SECRET',
    type: 'SECRET',
    severity: 'critical',
    pattern: /(?:password|secret|apikey|api_key|token|jwt_secret)\s*[:=]\s*['"`][^'"`]{6,}['"`]/gi,
    message: 'Secret hardcoded no código — usa variáveis de ambiente (.env)',
    fix: (code) => code.replace(
      /((?:password|secret|apikey|api_key|token|jwt_secret)\s*[:=]\s*)(['"`])[^'"`]+\2/gi,
      '$1process.env.SECRET_REDACTED'
    ),
  },
  {
    id: 'EVAL_USAGE',
    type: 'CODE_INJECTION',
    severity: 'critical',
    pattern: /\beval\s*\(/g,
    message: 'eval() é extremamente perigoso — nunca usar com input externo',
    fix: (code) => code.replace(/\beval\s*\(/g, '/* BLOCKED_EVAL( */'),
  },
  {
    id: 'CONSOLE_LOG_SENSITIVE',
    type: 'INFO_LEAK',
    severity: 'medium',
    pattern: /console\.log\s*\([^)]*(?:password|token|secret|senha|jwt)[^)]*\)/gi,
    message: 'console.log com dados sensíveis — remover em produção',
    fix: (code) => code.replace(/console\.log\s*\([^)]*(?:password|token|secret|senha|jwt)[^)]*\)/gi, '/* LOG_REMOVED */'),
  },
  {
    id: 'INSECURE_HTTP',
    type: 'NETWORK',
    severity: 'medium',
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1|192\.168)/g,
    message: 'Chamada HTTP não encriptada para servidor externo — usa HTTPS',
    fix: (code) => code.replace(/http:\/\/(?!localhost|127\.0\.0\.1|192\.168)/g, 'https://'),
  },
  {
    id: 'NO_INPUT_VALIDATION',
    type: 'VALIDATION',
    severity: 'medium',
    pattern: /req\.body\.\w+(?!\s*&&|\s*\|\||\s*\?)/g,
    message: 'Input de req.body sem validação — verifica antes de usar',
    fix: null,
  },
  {
    id: 'CORS_WILDCARD',
    type: 'CORS',
    severity: 'high',
    pattern: /origin\s*:\s*['"`]\*['"`]/g,
    message: 'CORS com wildcard (*) — restringe a origens específicas',
    fix: (code) => code.replace(/origin\s*:\s*['"`]\*['"`]/g, "origin: process.env.ALLOWED_ORIGIN"),
  },
  {
    id: 'NO_AUTH_CHECK',
    type: 'AUTH',
    severity: 'high',
    pattern: /router\.(?:get|post|put|delete|patch)\s*\([^,]+,\s*(?!autenticar|authenticate|auth|verifyToken)/g,
    message: 'Rota sem middleware de autenticação',
    fix: null,
  },
];

const RISK_LEVELS = { low: 0, medium: 1, high: 2, critical: 3 };
const RISK_NAMES = ['low', 'medium', 'high', 'critical'];

class SkillCybersecurity {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 60_000; // 1 minuto
  }

  /**
   * Entry point — escaneia código e retorna resultado estruturado
   */
  scan(code = {}) {
    if (!code || typeof code !== 'string') {
      return this._emptyResult();
    }

    const cacheKey = this._hash(code);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.result;
    }

    const vulnerabilities = this._detectVulnerabilities(code);
    const riskLevel = this._calculateRiskLevel(vulnerabilities);
    const fixes = this._generateFixes(vulnerabilities, code);
    const secureCode = this._applyAutoFixes(code, vulnerabilities);
    const blocked = riskLevel === 'critical' && vulnerabilities.some(v => v.severity === 'critical' && !v.autoFixed);

    const result = {
      vulnerabilities,
      riskLevel,
      fixes,
      secureCode,
      blocked,
      summary: this._generateSummary(vulnerabilities, riskLevel),
      timestamp: new Date().toISOString(),
    };

    this.cache.set(cacheKey, { result, ts: Date.now() });
    return result;
  }

  /**
   * Middleware — intercepta output e verifica segurança
   */
  middleware(output) {
    if (!output || typeof output !== 'object') return output;

    const codeFields = ['secureCode', 'code', 'snippet', 'generatedCode'];
    let modified = { ...output };
    let hasIssues = false;

    for (const field of codeFields) {
      if (modified[field]) {
        const scanResult = this.scan(modified[field]);
        if (scanResult.vulnerabilities.length > 0) {
          hasIssues = true;
          modified[field] = scanResult.secureCode;
          modified._securityScan = scanResult;
        }
      }
    }

    if (hasIssues && modified._securityScan?.blocked) {
      return {
        ...modified,
        blocked: true,
        blockReason: 'Vulnerabilidades críticas detectadas. Código reescrito automaticamente.',
      };
    }

    return modified;
  }

  _detectVulnerabilities(code) {
    const found = [];

    for (const rule of VULNERABILITY_PATTERNS) {
      const matches = [...code.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags))];
      if (matches.length > 0) {
        found.push({
          id: rule.id,
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
          occurrences: matches.length,
          locations: matches.map(m => this._getLineNumber(code, m.index)),
          autoFixable: !!rule.fix,
          autoFixed: false,
        });
      }
    }

    return found;
  }

  _calculateRiskLevel(vulnerabilities) {
    if (!vulnerabilities.length) return 'low';
    const maxLevel = Math.max(...vulnerabilities.map(v => RISK_LEVELS[v.severity] ?? 0));
    return RISK_NAMES[maxLevel];
  }

  _generateFixes(vulnerabilities) {
    return vulnerabilities.map(v => ({
      id: v.id,
      type: v.type,
      severity: v.severity,
      problem: v.message,
      action: v.autoFixable ? 'Auto-corrigido' : 'Revisão manual necessária',
      lines: v.locations,
    }));
  }

  _applyAutoFixes(code, vulnerabilities) {
    let secure = code;

    for (const vuln of vulnerabilities) {
      const rule = VULNERABILITY_PATTERNS.find(r => r.id === vuln.id);
      if (rule?.fix) {
        try {
          secure = rule.fix(secure);
          vuln.autoFixed = true;
        } catch { /* ignorar */ }
      }
    }

    return secure;
  }

  _generateSummary(vulnerabilities, riskLevel) {
    if (!vulnerabilities.length) {
      return { clean: true, message: 'Nenhuma vulnerabilidade detectada.' };
    }

    const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
    const high = vulnerabilities.filter(v => v.severity === 'high').length;
    const autoFixed = vulnerabilities.filter(v => v.autoFixed).length;

    return {
      clean: false,
      total: vulnerabilities.length,
      critical,
      high,
      autoFixed,
      message: `${vulnerabilities.length} vulnerabilidades (${critical} críticas, ${high} altas). ${autoFixed} corrigidas automaticamente.`,
      riskLevel,
    };
  }

  _getLineNumber(code, index) {
    return code.substring(0, index).split('\n').length;
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString(36);
  }

  _emptyResult() {
    return {
      vulnerabilities: [],
      riskLevel: 'low',
      fixes: [],
      secureCode: '',
      blocked: false,
      summary: { clean: true, message: 'Nada para analisar.' },
      timestamp: new Date().toISOString(),
    };
  }
}

export default new SkillCybersecurity();
