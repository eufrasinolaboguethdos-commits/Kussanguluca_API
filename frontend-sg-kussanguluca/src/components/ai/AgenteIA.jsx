import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiX, FiMessageCircle, FiShield,
  FiTrash2, FiTrendingUp, FiAlertTriangle,
  FiCheckCircle, FiGlobe, FiZap
} from 'react-icons/fi';

// ── System Prompt ─────────────────────────────────────────
const SYSTEM_PROMPT = `És o Kuss — assistente financeiro inteligente da plataforma SG Kussanguluca.

QUEM ÉS:
Não és um chatbot. És um consultor financeiro digital com personalidade real — directo, inteligente, empático e com sentido de humor quando o momento pede. Falas como um amigo muito bem informado, não como um manual.

COMO COMUNICAS:
- Fala de forma natural, como se estivesses numa conversa real
- Vai directo ao ponto — sem introduções longas nem "Claro! Com certeza!"
- Usa exemplos concretos e números reais quando possível
- Antecipa o que o utilizador precisa mesmo antes de ele perguntar
- Se vires um problema nos dados, diz — não esperes que perguntem
- Termina com uma pergunta ou sugestão que leve a conversa para a frente
- Usa emojis com moderação e só quando fazem sentido

ESPECIALIDADES:
- Análise financeira profunda (liquidez, margens, ROI, cashflow)
- Estratégia de negócios para MPMEs angolanas
- Fiscalidade angolana — IVA 14%, IRE, AGT, OGE
- Identificação de oportunidades e riscos financeiros
- Geração de ideias inovadoras adaptadas ao mercado angolano
- Pensamento estratégico — cenários, tendências, decisões

CONTEXTO ANGOLA:
- Moeda: Kwanza (AOA/Kz) — mercado volátil com risco cambial
- Economia informal significativa — adapta os conselhos a essa realidade
- BNA define política monetária, AGT é o fisco
- Sectores em crescimento: tecnologia, agro, logística, serviços

REGRAS DE OURO:
1. Nunca inventes números — usa só os dados fornecidos
2. Quando deres conselhos financeiros, diz que são orientações gerais
3. Se não souberes algo, diz claramente — mas sugere onde encontrar
4. Responde SEMPRE em português
5. Sê honesto mesmo quando a notícia não é boa

DADOS DA SESSÃO:
{{CONTEXT_DATA}}`;

// ── Anthropic API Call ────────────────────────────────────
async function callClaude(messages, contextData = {}) {
  const systemWithContext = SYSTEM_PROMPT.replace(
    '{{CONTEXT_DATA}}',
    contextData && Object.keys(contextData).length > 0
      ? JSON.stringify(contextData, null, 2)
      : 'Nenhum dado financeiro disponível nesta sessão.'
  );

  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3000/kuss/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ messages, contextData: systemWithContext }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.content?.find(b => b.type === 'text')?.text || 'Sem resposta.';
}

// ── Sugestões contextuais ─────────────────────────────────
const SUGESTOES_INICIAIS = [
  'Analisa a saúde financeira da minha empresa',
  'Como reduzir as despesas operacionais?',
  'Explica o IVA em Angola',
  'Quais indicadores devo monitorizar?',
  'Dá-me ideias para aumentar receitas',
];

// ── Componentes de UI ─────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 150, 300].map(d => (
      <span key={d} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
        style={{ animationDelay: `${d}ms` }} />
    ))}
  </div>
);

const MsgBubble = ({ msg, onSugestao }) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
          K
        </div>
      )}
      <div className={`max-w-[85%] ${isUser
        ? 'bg-brand-500 text-white rounded-2xl rounded-br-none px-3 py-2'
        : 'bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm'
      }`}>
        {isUser ? (
          <p className="text-sm">{msg.content}</p>
        ) : (
          <div className="text-sm text-gray-800 dark:text-slate-200 prose-sm">
            {formatMessage(msg.content)}
          </div>
        )}
        {msg.sugestoes?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.sugestoes.map((s, i) => (
              <button key={i} onClick={() => onSugestao(s)}
                className="text-[10px] bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-full hover:bg-brand-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
        <p className="text-[9px] opacity-40 mt-1 text-right">
          {new Date(msg.ts).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// Formata markdown básico para JSX
function formatMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Títulos ## e ###
    if (line.startsWith('### ')) {
      return <p key={i} className="font-bold text-gray-900 dark:text-white text-sm mt-2 mb-1">{line.slice(4)}</p>;
    }
    if (line.startsWith('## ')) {
      return <p key={i} className="font-bold text-brand-600 dark:text-brand-400 text-sm mt-2 mb-1 uppercase tracking-wide">{line.slice(3)}</p>;
    }
    // Bullet points
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={i} className="flex items-start gap-1.5 my-0.5 ml-1">
          <span className="text-brand-500 mt-1 flex-shrink-0 text-xs">●</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
    }
    // Listas numeradas
    if (line.match(/^\d+\./)) {
      const num = line.match(/^(\d+)\./)[1];
      return (
        <div key={i} className="flex items-start gap-2 my-0.5 ml-1">
          <span className="text-brand-500 font-bold text-xs flex-shrink-0 mt-0.5 w-4">{num}.</span>
          <span>{processInline(line.replace(/^\d+\./, '').trim())}</span>
        </div>
      );
    }
    // Linha vazia
    if (line.trim() === '') return <div key={i} className="h-1" />;
    // Linha normal com bold inline
    return <p key={i} className="my-0.5 leading-relaxed">{processInline(line)}</p>;
  });
}

// Processa **bold** e *italic* dentro de uma linha
function processInline(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-gray-600 dark:text-gray-300">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// ── Componente Principal ──────────────────────────────────
const AgenteIA = ({ empresa, dadosFinanceiros, stats }) => {
  const [aberto, setAberto] = useState(false);
  const [messages, setMessages] = useState([]); // formato Anthropic [{role, content}]
  const [displayMsgs, setDisplayMsgs] = useState([]); // para UI
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMsgs, loading]);

  useEffect(() => {
    if (aberto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aberto]);

  // Contexto financeiro para o assistente
  const contextData = {
    empresa: empresa ? {
      nome: empresa.nome,
      setor: empresa.setor,
      nif: empresa.NIF,
    } : null,
    financeiro: dadosFinanceiros || stats ? {
      totalReceitas: stats?.totalReceitas,
      totalDespesas: stats?.totalDespesas,
      saldo: stats?.saldo,
      ...dadosFinanceiros,
    } : null,
    dataActual: new Date().toLocaleDateString('pt-AO'),
  };

  const enviar = useCallback(async (texto) => {
    if (!texto?.trim() || loading) return;
    setInput('');
    setErro(null);

    const userMsg = { role: 'user', content: texto };
    const newMessages = [...messages, userMsg];

    // Adiciona à UI
    setDisplayMsgs(prev => [...prev, { ...userMsg, ts: Date.now(), sugestoes: [] }]);
    setMessages(newMessages);
    setLoading(true);

    try {
      const resposta = await callClaude(newMessages, contextData);

      // Mensagens Anthropic (histórico)
      setMessages(prev => [...prev, { role: 'assistant', content: resposta }]);

      // Sugestões dinâmicas baseadas na resposta
      const sugestoes = gerarSugestoes(resposta, texto);

      setDisplayMsgs(prev => [...prev, {
        role: 'assistant',
        content: resposta,
        ts: Date.now(),
        sugestoes,
      }]);
    } catch (err) {
      setErro(err.message);
      setDisplayMsgs(prev => [...prev, {
        role: 'assistant',
        content: `Desculpa, ocorreu um erro: ${err.message}. Tenta novamente.`,
        ts: Date.now(),
        sugestoes: ['Tentar novamente'],
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, contextData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    enviar(input);
  };

  const abrir = () => {
  setAberto(true);
  if (displayMsgs.length === 0) {
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const nome = empresa?.nome || null;

    setDisplayMsgs([{
      role: 'assistant',
      content: `${saudacao}! 👋 Sou o Kuss, o teu consultor financeiro digital.\n\n${nome ? `Estou a ver que estás a gerir a **${nome}** — já tenho os dados carregados e prontos para analisar.\n\n` : ''}Como estás hoje? Tudo bem com o negócio, ou há algo que te está a preocupar? Pode ser qualquer coisa — números, estratégia, uma dúvida fiscal, o que quiseres. 😊`,
      ts: Date.now(),
      sugestoes: SUGESTOES_INICIAIS,
    }]);
  }
};

  const limpar = () => {
    setMessages([]);
    setDisplayMsgs([]);
    setErro(null);
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => aberto ? setAberto(false) : abrir()}
        className="fixed bottom-24 right-6 z-40 bg-white/10 backdrop-blur-sm border border-white/20 text-gray-300 px-4 py-3 rounded-full shadow-sm transition-all flex items-center gap-2 opacity-30 hover:opacity-100 hover:bg-gradient-to-br hover:from-brand-500 hover:to-blue-600 hover:text-white hover:shadow-xl hover:scale-105"
        aria-label="Assistente IA"
      >
        <FiZap size={20} />
        <span className="text-sm font-bold hidden sm:inline">Kuss IA</span>
        {!aberto && displayMsgs.length > 0 && (
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Janela do chat */}
      {aberto && (
        <div className="fixed bottom-44 right-6 z-40 w-80 sm:w-[400px] h-[520px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-slate-700">

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-white text-sm">
                K
              </div>
              <div>
                <p className="font-bold text-white text-sm">Kuss — Assistente IA</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-blue-100">Online • Powered by Claude</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={limpar} title="Limpar conversa"
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <FiTrash2 size={15} />
              </button>
              <button onClick={() => setAberto(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Capacidades (só no início) */}
          {displayMsgs.length <= 1 && (
            <div className="flex gap-3 px-3 py-2 bg-brand-50 dark:bg-slate-900/50 border-b border-brand-100 dark:border-slate-700 flex-shrink-0">
              {[
                { icon: FiTrendingUp, label: 'Finanças' },
                { icon: FiGlobe, label: 'Angola' },
                { icon: FiShield, label: 'Auditoria' },
              ].map(({ icon: IconComp,label }) => (
                <div key={label} className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                  <IconComp size={11} /> {label}
                </div>
              ))}
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-slate-900/30">
            {displayMsgs.map((msg, i) => (
              <MsgBubble key={i} msg={msg} onSugestao={enviar} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
                  K
                </div>
                <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl rounded-bl-none shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            {erro && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2 mb-2">
                <FiAlertTriangle size={12} />
                {erro}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunta qualquer coisa..."
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white p-2 rounded-xl transition-colors">
              <FiSend size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

// Gera sugestões contextuais baseadas na conversa
function gerarSugestoes(resposta, pergunta) {
  const r = resposta.toLowerCase();
  const p = pergunta.toLowerCase();

  if (r.includes('liquidez') || p.includes('liquidez')) {
    return ['Como melhorar a liquidez?', 'Projetar cash flow', 'Ver indicadores'];
  }
  if (r.includes('despesa') || p.includes('despesa')) {
    return ['Como cortar custos?', 'Analisar categorias', 'Comparar com receitas'];
  }
  if (r.includes('iva') || r.includes('imposto') || r.includes('fiscal')) {
    return ['Incentivos fiscais 2025', 'Como declarar IVA?', 'IRE em Angola'];
  }
  if (r.includes('ideia') || r.includes('estratégia') || r.includes('crescimento')) {
    return ['Como financiar crescimento?', 'Análise de mercado', 'Plano de negócio'];
  }
  return ['Analisar a minha empresa', 'Dicas de poupança', 'Como crescer o negócio?'];
}

export default AgenteIA;