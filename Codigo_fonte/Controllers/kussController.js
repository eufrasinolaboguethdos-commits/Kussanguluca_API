/**
 * kussController.js
 */

import { connection } from '../Config/db.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// ── Pesquisa RAG ─────────────────────────────────────────
async function pesquisarConhecimento(pergunta, limite = 5) {
  const palavras = extrairPalavras(pergunta);
  if (!palavras.length) return [];

  const condicoes = palavras.map(() => `k.palavras_chave LIKE ?`).join(' OR ');
  const params = palavras.map(p => `%${p}%`);

  const [chunks] = await connection.query(
    `SELECT 
       k.id_chunk, k.titulo, k.conteudo, k.palavras_chave,
       k.contexto, k.artigo, k.relevancia,
       f.titulo AS fonte_titulo, f.tipo AS fonte_tipo,
       f.autor, f.ano, f.url,
       c.nome AS categoria
     FROM kb_chunk k
     JOIN kb_fonte f ON k.id_fonte = f.id_fonte
     JOIN kb_categoria c ON f.id_categoria = c.id_categoria
     WHERE k.ativo = 1 AND f.ativo = 1
       AND (${condicoes})
     ORDER BY k.relevancia DESC, c.prioridade ASC
     LIMIT ${parseInt(limite, 10)}`,
    params
  );
  return chunks;
}

// ── Extrai palavras-chave ────────────────────────────────
function extrairPalavras(texto) {
  const stopwords = new Set([
    'como', 'qual', 'quais', 'quando', 'onde', 'porque', 'para',
    'que', 'com', 'sem', 'uma', 'uns', 'das', 'dos', 'nos', 'nas',
    'pelo', 'pela', 'isso', 'esse', 'esta', 'este', 'minha', 'meu',
    'posso', 'devo', 'tenho', 'fazer', 'sobre', 'mais', 'muito'
  ]);
  return texto
    .toLowerCase()
    .replace(/[^a-záàâãéèêíóôõúçñ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, 8);
}

// ── Formata contexto RAG ─────────────────────────────────
function formatarContextoRAG(chunks) {
  if (!chunks.length) return null;
  return chunks.map((c, i) => `
[FONTE ${i + 1}] ${c.categoria} — "${c.fonte_titulo}" ${c.autor ? `(${c.autor}${c.ano ? `, ${c.ano}` : ''})` : ''}
${c.artigo ? `Artigo: ${c.artigo}` : ''}
${c.titulo}: ${c.conteudo}
`.trim()).join('\n\n---\n\n');
}

// ── System Prompt ────────────────────────────────────────
function buildSystemPrompt(contextRAG, dadosEmpresa) {
  const basePrompt = `És o Kussanguluca do Grupo Os Tira Pão — assistente financeiro inteligente da plataforma SG Kussanguluca.

IDENTIDADE:
Não és um chatbot genérico. És um consultor financeiro digital especializado em Angola, com personalidade real — directo, inteligente e empático. Fala como um amigo muito bem informado.

HIERARQUIA DE FONTES:
1. BASE DE DADOS INTERNA: Se a resposta estiver nas FONTES INTERNAS, usa-as como fonte principal
2. CONHECIMENTO GERAL: Se não houver fontes internas suficientes, usa o teu conhecimento treinado

ESPECIALIDADES:
- Análise financeira (liquidez, margens, ROI, cashflow, auditoria)
- Legislação angolana (IVA, IRE, INSS, AGT, constituição de empresas)
- Estratégia para MPMEs angolanas
- Geração de relatórios detalhados quando pedido

GERAÇÃO DE RELATÓRIOS:
Se o utilizador pedir um relatório, gera-o em Markdown estruturado com:
- Título e data
- Resumo executivo
- Análise detalhada por secções
- Conclusões e recomendações

DADOS DA EMPRESA ACTUAL:
${dadosEmpresa ? JSON.stringify(dadosEmpresa, null, 2) : 'Sem dados da empresa nesta sessão.'}

REGRAS:
1. Nunca inventes dados financeiros — usa só os dados fornecidos
2. Avisos legais quando deres conselhos fiscais/jurídicos
3. Responde SEMPRE em português
4. Sê honesto quando não souberes algo`;

  if (contextRAG) {
    return `${basePrompt}\n\n====== FONTES INTERNAS ======\n${contextRAG}\n====== FIM DAS FONTES ======\n\nPrioriza as informações acima.`;
  }
  return basePrompt;
}

// ── Guarda relatório e retorna o id ─────────────────────
async function guardarRelatorio(id_empresa, id_usuario, tipo, titulo, conteudo, dadosEntrada, fontesUsadas) {
  try {
    const [result] = await connection.execute(
      `INSERT INTO kb_relatorio_ia 
         (id_empresa, id_usuario, tipo, titulo, conteudo, dados_entrada, fontes_usadas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_empresa,
        id_usuario || null,
        tipo,
        titulo,
        conteudo,
        JSON.stringify(dadosEntrada || {}),
        JSON.stringify(fontesUsadas || [])
      ]
    );
    return result.insertId; // ← retorna o id
  } catch (err) {
    console.error('[Kuss] Erro ao guardar relatório:', err);
    return null;
  }
}

// ── Detecta pedido de relatório ──────────────────────────
function isRelatorioRequest(texto) {
  const keywords = ['relatório', 'relatorio', 'auditoria', 'análise completa', 'analise completa',
    'gera um', 'cria um', 'elabora', 'documento', 'resumo executivo', 'diagnóstico'];
  return keywords.some(k => texto.toLowerCase().includes(k));
}

function detectarTipoRelatorio(texto) {
  const t = texto.toLowerCase();
  if (t.includes('auditoria')) return 'auditoria';
  if (t.includes('liquidez') || t.includes('financeiro')) return 'analise_financeira';
  if (t.includes('fiscal') || t.includes('imposto')) return 'analise_fiscal';
  if (t.includes('estratégia') || t.includes('negócio')) return 'estrategia';
  return 'relatorio_geral';
}

// ── ENDPOINT PRINCIPAL: POST /kuss/chat ─────────────────
export async function kussChat(req, res) {
  try {
    const { messages, contextData } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages é obrigatório' });
    }

    const ultimaPergunta = messages[messages.length - 1]?.content || '';
    const id_empresa = contextData?.empresa?.id || req.usuario?.id_empresa;
    const id_usuario = req.usuario?.id;

    // 1. RAG
    const chunks = await pesquisarConhecimento(ultimaPergunta);
    const contextRAG = chunks.length > 0 ? formatarContextoRAG(chunks) : null;

    // 2. System prompt
    const systemPrompt = buildSystemPrompt(contextRAG, contextData);

    // 3. Claude
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages.slice(-10),
      })
    });

    if (!anthropicResponse.ok) {
      const errData = await anthropicResponse.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Anthropic API error ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const resposta = anthropicData.content?.find(b => b.type === 'text')?.text || 'Sem resposta.';

    // 4. Guarda relatório se necessário
    let idRelatorioGerado = null;
    if (isRelatorioRequest(ultimaPergunta) && id_empresa) {
      const tipoRelatorio = detectarTipoRelatorio(ultimaPergunta);
      idRelatorioGerado = await guardarRelatorio(
        id_empresa,
        id_usuario,
        tipoRelatorio,
        `${tipoRelatorio} — ${new Date().toLocaleDateString('pt-AO')}`,
        resposta,
        contextData,
        chunks.map(c => ({ id: c.id_chunk, fonte: c.fonte_titulo }))
      );
    }

    // 5. Guarda conversa
    try {
      await connection.execute(
        `INSERT INTO kb_conversa (id_usuario, id_empresa, pergunta, resposta, fontes_usadas)
         VALUES (?, ?, ?, ?, ?)`,
        [id_usuario || null, id_empresa || null, ultimaPergunta, resposta,
          JSON.stringify(chunks.map(c => c.id_chunk))]
      );
    } catch { /* não crítico */ }

    // 6. Responde
    res.json({
      content: [{ type: 'text', text: resposta }],
      fontes_usadas: chunks.length,
      rag_activo: chunks.length > 0,
      id_relatorio: idRelatorioGerado || null,
    });

  } catch (err) {
    console.error('[Kuss] Erro:', err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /kuss/relatorios ─────────────────────────────────
export async function listarRelatorios(req, res) {
  try {
    const id_empresa = req.query.id_empresa || req.usuario?.id_empresa;
    if (!id_empresa) return res.status(400).json({ error: 'id_empresa obrigatório' });
    const [rows] = await connection.execute(
      `SELECT id_relatorio, tipo, titulo, criado_em FROM kb_relatorio_ia
       WHERE id_empresa = ? ORDER BY criado_em DESC LIMIT 20`,
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET /kuss/relatorios/:id ─────────────────────────────
export async function obterRelatorio(req, res) {
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM kb_relatorio_ia WHERE id_relatorio = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET /kuss/relatorios/:id/pdf ─────────────────────────
// GET /kuss/relatorios/:id/pdf
export async function exportarRelatorioPDF(req, res) {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM kb_relatorio_ia WHERE id_relatorio = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });

    const rel = rows[0];

    // ── Constantes ───────────────────────────────────
    const M = 50;                          // margem lateral
    const W = 495;                         // largura do conteúdo
    const FOOTER_H = 28;
    const HEADER_H = 75;
    const MAX_Y = 842 - M - FOOTER_H;     // limite inferior do conteúdo

    // ── Cores ────────────────────────────────────────
    const C = {
      blue:      '#1e40af',
      blueDark:  '#1e3a8a',
      blueLight: '#eff6ff',
      text:      '#374151',
      textDark:  '#111827',
      gray:      '#9ca3af',
      line:      '#e5e7eb',
    };

    // ── Documento ────────────────────────────────────
    const doc = new PDFDocument({
      size: 'A4', margin: M, bufferPages: true,
      info: { Title: rel.titulo, Author: 'SG Kussanguluca' }
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${rel.id_relatorio}.pdf"`);
    doc.pipe(res);

    // ── Helpers ──────────────────────────────────────

    /** Remove emojis e markdown stars */
    const clean = (t = '') => t
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/\*\*/g, '').trim();

    /** Garante espaço para `needed` px; adiciona página se necessário */
    const need = (needed) => {
      if (doc.y + needed > MAX_Y) {
        doc.addPage();
        doc.y = HEADER_H + 10;
      }
    };

    /** Garante espaço calculado dinamicamente para um bloco de texto */
    const needText = (text, opts = {}) => {
      const h = doc.heightOfString(text, { width: opts.width || W, ...opts });
      need(h + 4);
    };

    /** Linha horizontal */
    const hline = (color = C.line, lw = 0.8) => {
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y)
         .strokeColor(color).lineWidth(lw).stroke();
    };

    // ── Cabeçalho (reutilizado por evento pageAdded) ──
    const drawHeader = () => {
      doc.rect(0, 0, 595, HEADER_H).fill(C.blue);
      doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold')
         .text('SG Kussanguluca', M, 16, { width: 300, lineBreak: false });
      doc.fontSize(9).font('Helvetica')
         .text('Sistema de Gestão Financeira', M, 47, { width: 300, lineBreak: false });
      doc.fontSize(9)
         .text(`Gerado em: ${new Date(rel.criado_em).toLocaleDateString('pt-AO')}`,
               M, 47, { width: W, align: 'right', lineBreak: false });
    };

    drawHeader();
    doc.on('pageAdded', () => { drawHeader(); doc.y = HEADER_H + 10; });

    // ── Título do relatório ──────────────────────────
    doc.y = HEADER_H + 14;
    const tituloLimpo = clean(rel.titulo);
    doc.fillColor(C.blue).fontSize(13).font('Helvetica-Bold')
       .text(tituloLimpo, M, doc.y, { width: W, align: 'center', paragraphGap: 6 });
    doc.moveDown(0.3);
    hline(C.blue, 1.5);
    doc.moveDown(0.7);

    // ── Parser de conteúdo ───────────────────────────
    const linhas = rel.conteudo.split('\n');
    let tabelaAvisada = false;

    for (const linha of linhas) {
      const raw   = linha;
      const trim  = linha.trim();

      // Linha vazia
      if (!trim) { doc.moveDown(0.3); tabelaAvisada = false; continue; }

      // Tabela markdown — mostra aviso uma vez
      if (trim.startsWith('|')) {
        if (!tabelaAvisada) {
          need(14);
          doc.fillColor(C.gray).fontSize(8).font('Helvetica-Oblique')
             .text('[ Dados tabulares disponíveis na versão Excel ]',
                   M, doc.y, { width: W, align: 'center', paragraphGap: 4 });
          tabelaAvisada = true;
        }
        continue;
      }
      tabelaAvisada = false;

      // Separador ---
      if (trim === '---') {
        need(10);
        doc.moveDown(0.2); hline(); doc.moveDown(0.3);
        continue;
      }

      // ## Secção principal
      if (raw.startsWith('## ')) {
        const t = clean(raw.slice(3)).toUpperCase();
        need(28);
        doc.moveDown(0.3);
        const y0 = doc.y;
        doc.rect(M, y0, W, 20).fill(C.blueLight);
        doc.fillColor(C.blue).fontSize(10).font('Helvetica-Bold')
           .text(t, M + 6, y0 + 4, { width: W - 12, lineBreak: false });
        doc.y = y0 + 24;
        doc.moveDown(0.2);
        continue;
      }

      // ### Subsecção
      if (raw.startsWith('### ')) {
        const t = clean(raw.slice(4));
        needText(t, { fontSize: 10 });
        doc.moveDown(0.2);
        doc.fillColor(C.blueDark).fontSize(10).font('Helvetica-Bold')
           .text(t, M, doc.y, { width: W, paragraphGap: 3 });
        continue;
      }

      // # Título simples
      if (raw.startsWith('# ')) {
        const t = clean(raw.slice(2));
        needText(t, { fontSize: 10 });
        doc.fillColor(C.textDark).fontSize(10).font('Helvetica-Bold')
           .text(t, M, doc.y, { width: W, paragraphGap: 3 });
        continue;
      }

      // Bullet - ou •
      if (trim.startsWith('- ') || trim.startsWith('• ')) {
        const t = clean(trim.slice(2));
        if (!t) continue;
        needText(`• ${t}`, { fontSize: 9.5 });
        doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
           .text(`• ${t}`, M + 10, doc.y, { width: W - 10, paragraphGap: 2 });
        continue;
      }

      // Lista numerada
      if (trim.match(/^\d+\.\s/)) {
        const t = clean(trim);
        needText(t, { fontSize: 9.5 });
        doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
           .text(t, M + 10, doc.y, { width: W - 10, paragraphGap: 2 });
        continue;
      }

      // Texto normal (com negrito inline)
      const semEmoji = trim
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '');
      if (!semEmoji) continue;

      if (/\*\*/.test(semEmoji)) {
        // Renderiza negrito: divide em partes, escreve com continued
        const partes = semEmoji.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        // Calcula altura total da linha para reservar espaço
        const textoPlano = clean(semEmoji);
        needText(textoPlano, { fontSize: 9.5 });

        let primeiro = true;
        for (const parte of partes) {
          if (!parte.trim()) continue;
          const isBold = parte.startsWith('**') && parte.endsWith('**');
          const t = isBold ? parte.slice(2, -2).trim() : parte
            .replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
          if (!t) continue;
          doc
            .fillColor(isBold ? C.textDark : C.text)
            .fontSize(9.5)
            .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
            .text(t,
              primeiro ? M   : undefined,
              primeiro ? doc.y : undefined,
              { continued: true, width: W, lineGap: 1 }
            );
          primeiro = false;
        }
        // Fecha linha e avança cursor
        doc.text(' ', { continued: false });
        doc.moveDown(0.15);
      } else {
        needText(semEmoji, { fontSize: 9.5 });
        doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
           .text(semEmoji, M, doc.y, { width: W, paragraphGap: 3, lineGap: 1 });
      }
    }

    // ── Rodapé em todas as páginas ───────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const fy = 842 - FOOTER_H;
      doc.rect(0, fy, 595, FOOTER_H).fill('#f1f5f9');
      doc.fillColor(C.gray).fontSize(7.5).font('Helvetica')
         .text(
           `Kussanguluca — SG Kussanguluca  |  Página ${i + 1} de ${range.count}`,
           M, fy + 9, { width: W, align: 'center', lineBreak: false }
         );
    }

    doc.end();
  } catch (err) {
    console.error('[PDF]', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /kuss/relatorios/:id/excel
export async function exportarRelatorioExcel(req, res) {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM kb_relatorio_ia WHERE id_relatorio = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });

    const rel = rows[0];
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SG Kussanguluca';
    wb.created = new Date();

    const ws = wb.addWorksheet('Relatório', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true }
    });

    ws.getColumn('A').width = 110;

    // ── Cabeçalho principal ─────────────────────────────
    ws.mergeCells('A1:A2');
    const headerCell = ws.getCell('A1');
    headerCell.value = 'SG KUSSANGULUCA — Sistema de Gestão Financeira';
    headerCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 35;

    // ── Título do relatório ─────────────────────────────
    ws.addRow([]);
    const titleRow = ws.addRow([rel.titulo]);
    titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1E3A8A' } };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.height = 25;

    const dateRow = ws.addRow([`Gerado em: ${new Date(rel.criado_em).toLocaleDateString('pt-AO')}`]);
    dateRow.getCell(1).font = { size: 9, color: { argb: 'FF6B7280' }, italic: true };
    dateRow.getCell(1).alignment = { horizontal: 'center' };

    ws.addRow([]);

    // ── Conteúdo com formatação ─────────────────────────
    const linhas = rel.conteudo.split('\n');
    for (const linha of linhas) {
      if (linha.startsWith('## ')) {
        ws.addRow([]);
        const row = ws.addRow([linha.slice(3).toUpperCase()]);
        const cell = row.getCell(1);
        cell.font = { bold: true, size: 11, color: { argb: 'FF1E40AF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        cell.alignment = { horizontal: 'left', indent: 1 };
        row.height = 20;

      } else if (linha.startsWith('### ')) {
        const row = ws.addRow([linha.slice(4)]);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF1E3A8A' } };
        row.height = 18;

      } else if (linha.startsWith('- ') || linha.startsWith('• ')) {
        const row = ws.addRow([`   •  ${linha.slice(2)}`]);
        row.getCell(1).font = { size: 10, color: { argb: 'FF374151' } };

      } else if (linha.startsWith('---')) {
        const row = ws.addRow(['']);
        row.getCell(1).border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };

      } else if (linha.trim() === '') {
        ws.addRow([]);

      } else {
        // Remove markdown bold para Excel
        const texto = linha.replace(/\*\*([^*]+)\*\*/g, '$1');
        const isBold = /\*\*/.test(linha);
        const row = ws.addRow([texto]);
        row.getCell(1).font = { size: 10, bold: isBold, color: { argb: 'FF374151' } };
      }
    }

    // ── Rodapé ──────────────────────────────────────────
    ws.addRow([]);
    const footerRow = ws.addRow(['Relatório gerado pelo assistente Kussanguluca — SG Kussanguluca']);
    footerRow.getCell(1).font = { size: 8, italic: true, color: { argb: 'FF9CA3AF' } };
    footerRow.getCell(1).alignment = { horizontal: 'center' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${rel.id_relatorio}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[Excel]', err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /kuss/fontes ─────────────────────────────────────
export async function listarFontes(req, res) {
  try {
    const [rows] = await connection.execute(
      `SELECT f.*, c.nome AS categoria, COUNT(k.id_chunk) AS total_chunks
       FROM kb_fonte f
       JOIN kb_categoria c ON f.id_categoria = c.id_categoria
       LEFT JOIN kb_chunk k ON k.id_fonte = f.id_fonte AND k.ativo = 1
       WHERE f.ativo = 1
       GROUP BY f.id_fonte
       ORDER BY c.prioridade, f.titulo`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── POST /kuss/conhecimento ──────────────────────────────
export async function adicionarConhecimento(req, res) {
  try {
    const { id_fonte, titulo, conteudo, palavras_chave, contexto, artigo } = req.body;
    if (!id_fonte || !conteudo) return res.status(400).json({ error: 'id_fonte e conteudo obrigatórios' });
    const [result] = await connection.execute(
      `INSERT INTO kb_chunk (id_fonte, titulo, conteudo, palavras_chave, contexto, artigo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_fonte, titulo || null, conteudo, palavras_chave || null, contexto || null, artigo || null]
    );
    res.status(201).json({ id_chunk: result.insertId, message: 'Conhecimento adicionado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}