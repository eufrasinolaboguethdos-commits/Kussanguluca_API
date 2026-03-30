import React, { useState, useEffect } from 'react';
import { useCompanyId } from '../hooks/useCompanyId';
import { saudeService } from '../services/saudeService';
import {
    FiShield, FiTrendingUp, FiTrendingDown, FiAlertCircle,
    FiCheckCircle, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const formatarValor = (v) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v || 0);

const SaudeFinanceira = () => {
    const { companyId, loadingCompany } = useCompanyId();
    const [saude, setSaude] = useState(null);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    const carregarSaude = async () => {
        if (!companyId) return;
        try {
            setLoading(true);
            const dados = await saudeService.obter(companyId);
            setSaude(dados);
        } catch (err) {
            console.error('Erro saude:', err);
        } finally {
            setLoading(false);
        }
    };

    const actualizar = async () => {
        setAtualizando(true);
        await carregarSaude();
        setAtualizando(false);
    };

    useEffect(() => {

        if (loadingCompany) return;
        if (!companyId) {
            setLoading(false); // ← para o loading
            return;
        }
        carregarSaude();
    }, [companyId, loadingCompany]);

    if (loadingCompany || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-brand-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400 text-sm">A calcular saúde financeira...</p>
                </div>
            </div>
        );
    }
    if (!companyId && !loadingCompany) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-400 font-semibold">Nenhuma empresa seleccionada</p>
                    <p className="text-gray-300 text-sm mt-1">Selecciona ou cria uma empresa para ver este conteúdo</p>
                </div>
            </div>
        );
    }

    // Configuração do semáforo
    const nivelConfig = {
        verde: {
            cor: '#10b981',
            corBg: 'from-emerald-500 to-teal-600',
            corLight: 'bg-emerald-50 border-emerald-200',
            corTexto: 'text-emerald-700',
            icone: <FiCheckCircle size={28} />,
            label: 'Situação Saudável',
            emoji: '🟢'
        },
        amarelo: {
            cor: '#f59e0b',
            corBg: 'from-amber-500 to-orange-500',
            corLight: 'bg-amber-50 border-amber-200',
            corTexto: 'text-amber-700',
            icone: <FiAlertTriangle size={28} />,
            label: 'Requer Atenção',
            emoji: '🟡'
        },
        vermelho: {
            cor: '#f43f5e',
            corBg: 'from-rose-500 to-pink-600',
            corLight: 'bg-rose-50 border-rose-200',
            corTexto: 'text-rose-700',
            icone: <FiAlertCircle size={28} />,
            label: 'Situação Crítica',
            emoji: '🔴'
        }
    };

    const nivel = saude?.nivel || 'verde';
    const cfg = nivelConfig[nivel];

    const dadosPizza = [
        { name: 'Receitas', value: saude?.totalReceitas || 0, color: '#10b981' },
        { name: 'Despesas', value: saude?.totalDespesas || 0, color: '#f43f5e' },
    ];

    const dadosPontuacao = [
        { name: 'Pontuação', value: saude?.pontuacao || 0, fill: cfg.cor },
        { name: 'Restante', value: 100 - (saude?.pontuacao || 0), fill: '#f1f5f9' },
    ];

    return (
        <div className="space-y-5 animate-fade-in-up">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-2 bg-brand-50 rounded-xl">
                            <FiShield className="text-brand-500" size={18} />
                        </span>
                        Saúde Financeira
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 ml-10">Diagnóstico automático da situação financeira</p>
                </div>
                <button
                    onClick={actualizar}
                    disabled={atualizando}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FiRefreshCw size={15} className={atualizando ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* ── Semáforo Principal ── */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.corBg} p-6 text-white shadow-xl`}>
                <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white opacity-5" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white opacity-5" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                            Estado Geral {cfg.emoji}
                        </p>
                        <h2 className="text-3xl font-extrabold">{cfg.label}</h2>
                        <p className="text-white/80 text-sm mt-2 max-w-md leading-relaxed">
                            {saude?.analise_texto}
                        </p>
                    </div>

                    {/* Pontuação circular */}
                    <div className="flex-shrink-0 text-center">
                        <div className="relative w-28 h-28">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dadosPontuacao} cx="50%" cy="50%" innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} dataKey="value">
                                        {dadosPontuacao.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-extrabold text-white">{saude?.pontuacao}</span>
                                <span className="text-white/70 text-xs">/ 100</span>
                            </div>
                        </div>
                        <p className="text-white/80 text-xs mt-1">Pontuação</p>
                    </div>
                </div>
            </div>

            {/* ── Cards de Indicadores ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Total Receitas',
                        valor: formatarValor(saude?.totalReceitas),
                        icone: <FiTrendingUp size={20} />,
                        cor: 'bg-emerald-50 text-emerald-600',
                        corValor: 'text-emerald-600'
                    },
                    {
                        label: 'Total Despesas',
                        valor: formatarValor(saude?.totalDespesas),
                        icone: <FiTrendingDown size={20} />,
                        cor: 'bg-rose-50 text-rose-600',
                        corValor: 'text-rose-600'
                    },
                    {
                        label: 'Saldo Líquido',
                        valor: formatarValor(saude?.saldo),
                        icone: <FiShield size={20} />,
                        cor: 'bg-blue-50 text-blue-600',
                        corValor: saude?.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    },
                    {
                        label: 'Razão Despesa',
                        valor: `${saude?.racaoDespesa || 0}%`,
                        icone: <FiAlertCircle size={20} />,
                        cor: 'bg-purple-50 text-purple-600',
                        corValor: saude?.racaoDespesa > 80 ? 'text-rose-600' : saude?.racaoDespesa > 60 ? 'text-amber-600' : 'text-emerald-600'
                    },
                ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
                            <div className={`p-2 rounded-xl ${item.cor}`}>{item.icone}</div>
                        </div>
                        <p className={`text-xl font-extrabold ${item.corValor}`}>{item.valor}</p>
                    </div>
                ))}
            </div>

            {/* ── Gráfico + Análise ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Distribuição */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
                        Distribuição Financeira
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dadosPizza} cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    labelLine={true}>
                                    {dadosPizza.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Legend />
                                <Tooltip formatter={(v) => formatarValor(v)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Indicadores detalhados */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">
                        Indicadores Detalhados
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Margem de Lucro', valor: `${saude?.margemLucro || 0}%`, alerta: saude?.margemLucro < 0 },
                            { label: 'Razão Despesa/Receita', valor: `${saude?.racaoDespesa || 0}%`, alerta: saude?.racaoDespesa > 80 },
                            { label: 'Saldo Líquido', valor: formatarValor(saude?.saldo), alerta: saude?.saldo < 0 },
                            { label: 'Pontuação de Saúde', valor: `${saude?.pontuacao || 0} / 100`, alerta: saude?.pontuacao < 40 },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">{item.label}</span>
                                <span className={`text-sm font-bold ${item.alerta ? 'text-rose-600' : 'text-gray-800'}`}>
                                    {item.valor}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Alerta se vermelho */}
                    {nivel === 'vermelho' && (
                        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                            <FiAlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-rose-700 leading-relaxed">
                                A situação requer acção imediata. Reveja as despesas e procure novas fontes de receita.
                            </p>
                        </div>
                    )}
                    {nivel === 'amarelo' && (
                        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                            <FiAlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Atenção! As despesas estão a aproximar-se do limite recomendado.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaudeFinanceira;