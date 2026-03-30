import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    FiSend, FiX, FiMessageCircle, FiTrendingUp,
    FiAlertTriangle, FiCheckCircle, FiShield,
    FiCode, FiAlertCircle, FiInfo, FiTrash2
} from 'react-icons/fi';
import agenteService from '../../services/ai/AgenteService';

// ── Security Badge ────────────────────────────────────────
const SecurityBadge = ({ security }) => {
    if (!security) return null;

    const configs = {
        low: { label: 'Seguro', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: FiCheckCircle },
        medium: { label: 'Atenção', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: FiAlertTriangle },
        high: { label: 'Risco Alto', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: FiAlertTriangle },
        critical: { label: 'Crítico', bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', icon: FiAlertCircle },
    };

    const cfg = configs[security.riskLevel] || configs.low;
    const Icon = cfg.icon;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text} mt-1`}>
            <FiShield size={10} />
            <span>{cfg.label}</span>
            {security.hasIssues && <span>• {security.vulnerabilityCount} issue{security.vulnerabilityCount > 1 ? 's' : ''}</span>}
        </div>
    );
};

// ── Security Warning Panel ────────────────────────────────
const SecurityWarning = ({ security }) => {
    const [expanded, setExpanded] = useState(false);

    if (!security?.hasIssues) return null;

    const isBlocked = security.blocked;

    return (
        <div className={`mt-2 rounded-xl border text-xs overflow-hidden ${isBlocked
                ? 'border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20'
                : 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
            }`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full flex items-center justify-between px-3 py-2 font-semibold ${isBlocked ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
                    }`}
            >
                <div className="flex items-center gap-1.5">
                    <FiShield size={12} />
                    <span>{isBlocked ? 'Código bloqueado — vulnerabilidades críticas' : `${security.vulnerabilityCount} vulnerabilidade(s) detectada(s)`}</span>
                </div>
                <span>{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <div className="px-3 pb-3 space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">{security.message}</p>
                    {isBlocked && (
                        <p className="text-rose-600 dark:text-rose-400 font-medium">
                            ✓ Código foi reescrito automaticamente com correcções de segurança.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Code Scan Panel ───────────────────────────────────────
const CodeScanPanel = ({ scan }) => {
    const [showSecure, setShowSecure] = useState(false);
    if (!scan) return null;

    const { vulnerabilities, riskLevel, fixes, secureCode } = scan;

    return (
        <div className="space-y-2 text-xs">
            <div className={`px-3 py-2 rounded-lg font-semibold ${riskLevel === 'low' ? 'bg-emerald-50 text-emerald-700' :
                    riskLevel === 'medium' ? 'bg-amber-50 text-amber-700' :
                        riskLevel === 'high' ? 'bg-orange-50 text-orange-700' :
                            'bg-rose-50 text-rose-700'
                }`}>
                Nível de risco: {riskLevel.toUpperCase()} • {vulnerabilities.length} vulnerabilidade(s)
            </div>

            {fixes.map((fix, i) => (
                <div key={i} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
                        <FiAlertTriangle size={11} className={fix.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'} />
                        [{fix.type}] {fix.severity}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{fix.problem}</p>
                    <p className="text-blue-600 dark:text-blue-400">→ {fix.action}</p>
                    {fix.lines?.length > 0 && (
                        <p className="text-gray-400">Linha(s): {fix.lines.join(', ')}</p>
                    )}
                </div>
            ))}

            {secureCode && secureCode.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowSecure(!showSecure)}
                        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold"
                    >
                        <FiCode size={12} />
                        {showSecure ? 'Ocultar' : 'Ver'} código corrigido
                    </button>
                    {showSecure && (
                        <pre className="mt-1 p-2 bg-gray-900 text-green-400 rounded-lg text-[10px] overflow-x-auto max-h-40">
                            {secureCode}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Cards de Conteúdo ─────────────────────────────────────
const CardLiquidez = ({ data }) => {
    const { indicadores, situacao, recomendacoes } = data;
    const cores = {
        verde: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        amarelo: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        vermelho: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    };

    return (
        <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: 'Liquidez Corrente', val: indicadores?.liquidezCorrente, ok: indicadores?.liquidezCorrente >= 1.2 },
                    { label: 'Liquidez Imediata', val: indicadores?.liquidezImediata, ok: indicadores?.liquidezImediata >= 0.5 },
                ].map((item, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-slate-700 p-2 rounded-lg text-center">
                        <p className="text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className={`text-base font-bold ${item.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{item.val ?? '—'}</p>
                    </div>
                ))}
            </div>
            <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${cores[situacao] || cores.amarelo}`}>
                Situação: {situacao?.toUpperCase()}
            </div>
            {recomendacoes?.map((rec, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <span>{rec.icone}</span>
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{rec.titulo}</p>
                        <p className="text-gray-500 dark:text-gray-400">{rec.descricao}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const CardSaude = ({ data }) => {
    const { score, nivel, mensagem, acoesPrioritarias } = data;
    const coresBg = { emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600' };

    return (
        <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-4 border-current flex items-center justify-center font-bold text-lg" style={{ borderColor: 'currentColor' }}>
                    <span className={coresBg[data.cor] || 'text-gray-700'}>{score}</span>
                </div>
                <div>
                    <p className={`font-semibold capitalize ${coresBg[data.cor] || ''}`}>{nivel}</p>
                    <p className="text-gray-600 dark:text-gray-400">{mensagem}</p>
                </div>
            </div>
            {acoesPrioritarias?.length > 0 && (
                <div className="space-y-1">
                    <p className="font-semibold text-gray-700 dark:text-gray-200">Acções:</p>
                    {acoesPrioritarias.map((a, i) => (
                        <div key={i} className="flex gap-1.5 items-center text-gray-600 dark:text-gray-400">
                            <FiCheckCircle size={11} className="text-blue-500 flex-shrink-0" />
                            {a}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const renderConteudo = (msg) => {
    const { conteudo } = msg;
    switch (conteudo?.tipo) {
        case 'analise_liquidez': return <CardLiquidez data={conteudo} />;
        case 'saude_financeira': return <CardSaude data={conteudo} />;
        case 'code_scan': return <CodeScanPanel scan={conteudo.scan} />;
        case 'saudacao':
        case 'fallback':
        case 'generica':
            return <p className="text-sm text-gray-700 dark:text-gray-300">{conteudo.mensagem}</p>;
        default:
            return conteudo?.mensagem
                ? <p className="text-sm text-gray-700 dark:text-gray-300">{conteudo.mensagem}</p>
                : null;
    }
};

// ── Componente Principal ──────────────────────────────────
const AgenteFinanceiro = ({ empresa, dadosFinanceiros }) => {
    const [aberto, setAberto] = useState(false);
    const [mensagens, setMensagens] = useState([]);
    const [input, setInput] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [secureMode] = useState(true);
    const endRef = useRef(null);

    // ← Contador de IDs único para evitar keys duplicadas
    const idRef = useRef(0);
    const novoId = () => ++idRef.current;

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const contexto = {
        nome: empresa?.nome || 'Empresa',
        setor: empresa?.setor || 'comercio',
        id: empresa?.id_empresa,
    };

    const enviar = useCallback(async (texto) => {
        if (!texto?.trim() || carregando) return;
        setInput('');

        // Mensagem do utilizador — ID único garantido
        setMensagens(prev => [...prev, {
            id: novoId(),
            tipo: 'usuario',
            texto,
            ts: new Date(),
        }]);

        setCarregando(true);
        try {
            const resposta = await agenteService.processarMensagem(texto, contexto, dadosFinanceiros || {});
            // Garante que a resposta também tem ID único
            setMensagens(prev => [...prev, { ...resposta, id: novoId(), tipo: 'agente' }]);
        } catch {
            setMensagens(prev => [...prev, {
                id: novoId(), // ← ID único garantido
                tipo: 'agente',
                titulo: 'Erro',
                conteudo: { tipo: 'erro', mensagem: 'Erro ao processar.' },
                sugestoes: [],
                _security: { riskLevel: 'low', clean: true },
            }]);
        } finally {
            setCarregando(false);
        }
    }, [carregando, contexto, dadosFinanceiros]);

    const handleSubmit = (e) => {
        e.preventDefault();
        enviar(input);
    };

    const abrir = () => {
        setAberto(true);
        if (mensagens.length === 0) enviar('olá');
    };

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => aberto ? setAberto(false) : abrir()}
                className="fixed bottom-24 right-6 z-40 bg-gradient-to-br from-brand-500 to-blue-600 text-white p-3.5 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2"
                aria-label="Assistente Financeiro"
            >
                <FiMessageCircle size={22} />
                {!aberto && <span className="text-sm font-semibold hidden sm:inline">Assistente</span>}
            </button>

            {/* Janela do chat */}
            {aberto && (
                <div className="fixed bottom-44 right-6 z-40 w-80 sm:w-96 h-[480px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <FiTrendingUp size={18} />
                            <div>
                                <p className="font-bold text-sm">Assistente Financeiro</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-blue-100">
                                    <FiShield size={10} />
                                    <span>Secure Mode {secureMode ? 'ON' : 'OFF'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setMensagens([]); agenteService.limparHistorico(); }}
                                className="p-1 text-blue-200 hover:text-white transition-colors"
                                title="Limpar conversa"
                            >
                                <FiTrash2 size={15} />
                            </button>
                            <button onClick={() => setAberto(false)} className="p-1 text-blue-200 hover:text-white">
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-slate-900/50">
                        {mensagens.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[88%] ${msg.tipo === 'usuario'
                                        ? 'bg-brand-500 text-white rounded-2xl rounded-br-none px-3 py-2 text-sm'
                                        : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm'
                                    }`}>
                                    {msg.tipo === 'agente' && (
                                        <>
                                            <p className="font-bold text-xs text-brand-600 dark:text-brand-400 mb-1.5">{msg.titulo}</p>
                                            {renderConteudo(msg)}
                                            <SecurityWarning security={msg._security} />
                                            <SecurityBadge security={msg._security} />

                                            {/* Sugestões */}
                                            {msg.sugestoes?.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {msg.sugestoes.map((s, i) => (
                                                        <button key={i} onClick={() => enviar(s)}
                                                            className="text-[10px] bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {msg.tipo === 'usuario' && <p>{msg.texto}</p>}
                                    <p className="text-[9px] opacity-50 mt-1 text-right">
                                        {new Date(msg.ts || msg.timestamp).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {carregando && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-2xl rounded-bl-none shadow-sm">
                                    <div className="flex gap-1">
                                        {[0, 150, 300].map(delay => (
                                            <span key={delay} className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 flex-shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre as suas finanças..."
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200"
                            disabled={carregando}
                        />
                        <button
                            type="submit"
                            disabled={carregando || !input.trim()}
                            className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-xl disabled:opacity-40 transition-colors"
                        >
                            <FiSend size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default AgenteFinanceiro;