import json, sys, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, HRFlowable, PageBreak, Image as RLImage)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from datetime import datetime

LOGO_PATH = os.path.join(os.path.dirname(__file__), 'sg_logo.png')

AZUL       = colors.HexColor("#1A237E")
AZUL_LIGHT = colors.HexColor("#E8EAF6")
VERDE      = colors.HexColor("#1B5E20")
VERDE_L    = colors.HexColor("#E8F5E9")
VERMELHO   = colors.HexColor("#B71C1C")
VERM_L     = colors.HexColor("#FFEBEE")
CINZA      = colors.HexColor("#37474F")
CINZA_L    = colors.HexColor("#ECEFF1")
AMARELO    = colors.HexColor("#FFF9C4")
LARANJA    = colors.HexColor("#E65100")
PRETO      = colors.black
BRANCO     = colors.white

def fmt_kz(valor):
    return f"{float(valor or 0):,.2f} Kz"

def gerar_pdf(dados_json, output_path):
    d = json.loads(dados_json)
    empresa       = d.get('empresa', 'SG Kussanguluca')
    periodo       = d.get('periodo', '')
    total_rec     = float(d.get('totalReceitas', 0))
    total_desp    = float(d.get('totalDespesas', 0))
    receitas      = d.get('receitas', [])
    despesas      = d.get('despesas', [])
    saldo         = total_rec - total_desp
    margem        = (saldo / total_rec * 100) if total_rec else 0
    razao         = (total_desp / total_rec * 100) if total_rec else 0
    n_trans       = len(receitas) + len(despesas)
    situacao_pos  = saldo >= 0
    alerta_alto   = razao > 80

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    story  = []

    # ─── ESTILOS PERSONALIZADOS ───────────────────────────────
    def estilo(nome, **kw):
        base = kw.pop('base', 'Normal')
        s = ParagraphStyle(nome, parent=styles[base], **kw)
        return s

    s_titulo  = estilo('Titulo',  base='Title',  fontSize=20, textColor=BRANCO,
                        alignment=TA_CENTER, spaceAfter=4, leading=24)
    s_sub     = estilo('Sub',     fontSize=10,  textColor=AZUL_LIGHT,
                        alignment=TA_CENTER, spaceAfter=2, italic=True)
    s_h2      = estilo('H2',      base='Heading2', fontSize=13, textColor=AZUL,
                        spaceBefore=14, spaceAfter=6, borderPad=2)
    s_h3      = estilo('H3',      base='Heading3', fontSize=11, textColor=CINZA,
                        spaceBefore=10, spaceAfter=4)
    s_body    = estilo('Body',    fontSize=10, textColor=PRETO,
                        alignment=TA_JUSTIFY, leading=15, spaceAfter=6)
    s_nota    = estilo('Nota',    fontSize=9,  textColor=CINZA,
                        italic=True, spaceAfter=4)
    s_alerta  = estilo('Alerta',  fontSize=10, textColor=LARANJA,
                        leading=14, spaceAfter=6, backColor=AMARELO)
    s_footer  = estilo('Footer',  fontSize=8,  textColor=CINZA,
                        alignment=TA_CENTER, italic=True)

    # ─── CABEÇALHO COM LOGO ──────────────────────────────────
    if os.path.exists(LOGO_PATH):
        logo_img = RLImage(LOGO_PATH, width=1.4*cm, height=1.4*cm)
        logo_cell = logo_img
    else:
        logo_cell = Paragraph("SG", s_titulo)

    cabecalho_data = [[
        logo_cell,
        [
            Paragraph("SG KUSSANGULUCA", s_titulo),
            Paragraph("Plataforma de Gestão Financeira", s_sub),
            Paragraph(f"Relatório Financeiro  •  {empresa}  •  {periodo}", s_sub),
        ]
    ]]
    t_cab = Table(cabecalho_data, colWidths=[1.8*cm, 15.2*cm])
    t_cab.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), AZUL),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING',   (0,0), (0,0),  10),
    ]))
    story.append(t_cab)
    story.append(Spacer(1, 0.5*cm))

    # Data de geração
    story.append(Paragraph(
        f"Documento gerado em: {datetime.now().strftime('%d de %B de %Y às %H:%M')}",
        s_nota))
    story.append(HRFlowable(width="100%", thickness=1.5, color=AZUL))
    story.append(Spacer(1, 0.3*cm))

    # ─── 1. INTRODUÇÃO ────────────────────────────────────────
    story.append(Paragraph("1. Introdução", s_h2))
    story.append(Paragraph(
        f"Este relatório apresenta uma análise financeira detalhada da empresa <b>{empresa}</b>, "
        f"referente ao período de <b>{periodo}</b>. "
        "O documento foi gerado automaticamente pela plataforma SG Kussanguluca e inclui "
        "todas as movimentações registadas, indicadores de desempenho e uma análise da situação "
        "financeira atual da empresa.", s_body))

    # ─── 2. RESUMO EXECUTIVO ──────────────────────────────────
    story.append(Paragraph("2. Resumo Executivo", s_h2))

    if situacao_pos and not alerta_alto:
        analise_exec = (
            f"A empresa <b>{empresa}</b> apresenta uma <b>situação financeira positiva</b> no período analisado. "
            f"Com um total de receitas de <b>{fmt_kz(total_rec)}</b> e despesas de <b>{fmt_kz(total_desp)}</b>, "
            f"o saldo líquido é de <b>{fmt_kz(saldo)}</b>, representando uma margem de lucro de <b>{margem:.1f}%</b>. "
            f"Foram registadas {len(receitas)} entradas de receita e {len(despesas)} despesas, "
            f"totalizando {n_trans} transações no período."
        )
    elif alerta_alto and situacao_pos:
        analise_exec = (
            f"A empresa <b>{empresa}</b> apresenta saldo positivo de <b>{fmt_kz(saldo)}</b>, "
            f"porém as despesas representam <b>{razao:.1f}%</b> das receitas — valor acima do recomendado (80%). "
            f"Apesar do resultado positivo, é importante controlar os gastos para garantir a sustentabilidade financeira. "
            f"Foram registadas {len(receitas)} receitas e {len(despesas)} despesas no período de <b>{periodo}</b>."
        )
    else:
        analise_exec = (
            f"A empresa <b>{empresa}</b> apresenta um <b>saldo negativo</b> de <b>{fmt_kz(saldo)}</b> no período analisado. "
            f"As receitas totalizaram <b>{fmt_kz(total_rec)}</b> enquanto as despesas atingiram "
            f"<b>{fmt_kz(total_desp)}</b>, resultando num défice de <b>{fmt_kz(abs(saldo))}</b>. "
            f"Recomenda-se uma revisão urgente dos gastos e estratégias para aumentar as receitas."
        )
    story.append(Paragraph(analise_exec, s_body))

    # Tabela de indicadores
    story.append(Spacer(1, 0.3*cm))
    ind_data = [
        ["Indicador", "Valor", "Avaliação"],
        ["Total de Receitas",    fmt_kz(total_rec),  "✅ Positivo"],
        ["Total de Despesas",    fmt_kz(total_desp), "⚠️ Monitorar" if alerta_alto else "✅ Controlado"],
        ["Saldo Líquido",        fmt_kz(saldo),      "✅ Positivo" if situacao_pos else "❌ Negativo"],
        ["Margem de Lucro",      f"{margem:.1f}%",   "✅ Boa" if margem > 20 else ("⚠️ Razoável" if margem > 0 else "❌ Negativa")],
        ["Razão Despesa/Receita",f"{razao:.1f}%",    "✅ Saudável" if razao <= 70 else ("⚠️ Alta" if razao <= 90 else "❌ Crítica")],
        ["Total de Transações",  str(n_trans),       f"{len(receitas)} receitas / {len(despesas)} despesas"],
    ]
    t_ind = Table(ind_data, colWidths=[7*cm, 5*cm, 5*cm])
    t_ind.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,0), AZUL),
        ('TEXTCOLOR',    (0,0), (-1,0), BRANCO),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 9),
        ('ALIGN',        (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [BRANCO, CINZA_L]),
        ('GRID',         (0,0), (-1,-1), 0.5, colors.grey),
        ('TOPPADDING',   (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0), (-1,-1), 6),
    ]))
    story.append(t_ind)

    # ─── ALERTA ───────────────────────────────────────────────
    if alerta_alto:
        story.append(Spacer(1, 0.4*cm))
        story.append(Paragraph(
            f"⚠️  ALERTA FINANCEIRO: As despesas representam {razao:.1f}% das receitas. "
            "Recomenda-se reduzir gastos operacionais e identificar categorias com maior impacto no orçamento.",
            s_alerta))
    if not situacao_pos:
        story.append(Paragraph(
            f"❌  SITUAÇÃO CRÍTICA: O saldo é negativo em {fmt_kz(abs(saldo))}. "
            "Acções imediatas recomendadas: (1) Rever contratos de despesas fixas; "
            "(2) Aumentar esforços comerciais para gerar mais receitas; "
            "(3) Adiar investimentos não essenciais.",
            s_alerta))

    # ─── 3. RECEITAS ──────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("3. Receitas Detalhadas", s_h2))

    if receitas:
        story.append(Paragraph(
            f"No período de <b>{periodo}</b>, a empresa registou <b>{len(receitas)} entradas de receita</b>, "
            f"totalizando <b>{fmt_kz(total_rec)}</b>. "
            "A tabela abaixo apresenta todas as movimentações de receita registadas, "
            "organizadas por data de ocorrência.", s_body))

        rec_data = [["#", "Data", "Descrição", "Categoria", "Valor"]]
        for i, r in enumerate(receitas, 1):
            rec_data.append([
                str(i),
                r.get('data', ''),
                r.get('descricao', ''),
                r.get('categoria', ''),
                fmt_kz(r.get('valor', 0))
            ])
        rec_data.append(["", "", "", "TOTAL", fmt_kz(total_rec)])

        t_rec = Table(rec_data, colWidths=[1*cm, 2.5*cm, 6.5*cm, 3.5*cm, 3.5*cm])
        t_rec.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), VERDE),
            ('TEXTCOLOR',     (0,0), (-1,0), BRANCO),
            ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
            ('BACKGROUND',    (0,-1),(-1,-1), VERDE),
            ('TEXTCOLOR',     (0,-1),(-1,-1), BRANCO),
            ('FONTNAME',      (0,-1),(-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,-1), 8),
            ('ALIGN',         (0,0), (1,-1), 'CENTER'),
            ('ALIGN',         (4,0), (4,-1), 'RIGHT'),
            ('ROWBACKGROUNDS',(0,1), (-1,-2), [BRANCO, VERDE_L]),
            ('GRID',          (0,0), (-1,-1), 0.4, colors.grey),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t_rec)
    else:
        story.append(Paragraph("Nenhuma receita registada no período selecionado.", s_nota))

    # ─── 4. DESPESAS ──────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("4. Despesas Detalhadas", s_h2))

    if despesas:
        story.append(Paragraph(
            f"No mesmo período foram registadas <b>{len(despesas)} despesas</b>, "
            f"totalizando <b>{fmt_kz(total_desp)}</b>. "
            "A tabela seguinte detalha cada despesa com a sua respectiva categoria, "
            "permitindo identificar os principais centros de custo da empresa.", s_body))

        desp_data = [["#", "Data", "Descrição", "Categoria", "Valor"]]
        for i, d2 in enumerate(despesas, 1):
            desp_data.append([
                str(i),
                d2.get('data', ''),
                d2.get('descricao', ''),
                d2.get('categoria', ''),
                fmt_kz(d2.get('valor', 0))
            ])
        desp_data.append(["", "", "", "TOTAL", fmt_kz(total_desp)])

        t_desp = Table(desp_data, colWidths=[1*cm, 2.5*cm, 6.5*cm, 3.5*cm, 3.5*cm])
        t_desp.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), VERMELHO),
            ('TEXTCOLOR',     (0,0), (-1,0), BRANCO),
            ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
            ('BACKGROUND',    (0,-1),(-1,-1), VERMELHO),
            ('TEXTCOLOR',     (0,-1),(-1,-1), BRANCO),
            ('FONTNAME',      (0,-1),(-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,-1), 8),
            ('ALIGN',         (0,0), (1,-1), 'CENTER'),
            ('ALIGN',         (4,0), (4,-1), 'RIGHT'),
            ('ROWBACKGROUNDS',(0,1), (-1,-2), [BRANCO, VERM_L]),
            ('GRID',          (0,0), (-1,-1), 0.4, colors.grey),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t_desp)
    else:
        story.append(Paragraph("Nenhuma despesa registada no período selecionado.", s_nota))

    # ─── 5. CONCLUSÃO ─────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("5. Conclusão e Recomendações", s_h2))

    if situacao_pos and not alerta_alto:
        conclusao = (
            f"A empresa <b>{empresa}</b> demonstra uma gestão financeira saudável no período analisado. "
            f"O saldo positivo de <b>{fmt_kz(saldo)}</b> e a margem de lucro de <b>{margem:.1f}%</b> "
            "indicam que as operações estão a gerar valor de forma consistente. "
            "Recomenda-se manter a disciplina financeira actual, diversificar as fontes de receita "
            "e considerar a criação de uma reserva de emergência para períodos de menor actividade."
        )
    elif alerta_alto:
        conclusao = (
            f"Embora a empresa <b>{empresa}</b> apresente saldo positivo, o elevado rácio de despesas "
            f"({razao:.1f}%) requer atenção. Recomenda-se: (1) Identificar e eliminar despesas desnecessárias; "
            "(2) Negociar melhores condições com fornecedores; "
            "(3) Estabelecer um orçamento mensal de despesas não superior a 70% das receitas previstas; "
            "(4) Monitorizar mensalmente a evolução dos custos por categoria."
        )
    else:
        conclusao = (
            f"A situação financeira da empresa <b>{empresa}</b> requer atenção imediata. "
            f"O défice de <b>{fmt_kz(abs(saldo))}</b> indica que as despesas superam as receitas. "
            "Acções urgentes recomendadas: (1) Auditoria detalhada de todas as despesas; "
            "(2) Suspensão de gastos não essenciais; "
            "(3) Desenvolvimento de um plano de recuperação financeira com metas mensais; "
            "(4) Consulta a um especialista financeiro."
        )
    story.append(Paragraph(conclusao, s_body))

    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=CINZA))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        f"SG Kussanguluca — Plataforma de Gestão Financeira  •  "
        f"Documento gerado automaticamente em {datetime.now().strftime('%d/%m/%Y')}  •  "
        "Este documento é de uso interno e confidencial.",
        s_footer))

    doc.build(story)
    print(f"PDF gerado: {output_path}")

if __name__ == "__main__":
    import json
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        dados_json = f.read()
    gerar_pdf(dados_json, sys.argv[2])