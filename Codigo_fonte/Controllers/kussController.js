/**
 * kussController.js
 * Backend RAG — pesquisa base de conhecimento + Claude
 */

import { connection } from '../Config/db.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';


// ── Pesquisa RAG na base de conhecimento ─────────────────
async function pesquisarConhecimento(pergunta, limite = 5) {
  const palavras = extrairPalavras(pergunta);
  if (!palavras.length) return [];

  const condicoes = palavras.map(() => `k.palavras_chave LIKE ?`).join(' OR ');
  const params = palavras.map(p => `%${p}%`);

  // Usa query() em vez de execute() — evita o bug de tipos com LIMIT dinâmico
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
    params   // só os params LIKE, sem o limite no array
  );

  return chunks;
}
// ── Extrai palavras-chave da pergunta ────────────────────
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
    .slice(0, 8); // máx 8 palavras
}

// ── Formata contexto RAG para o prompt ──────────────────
function formatarContextoRAG(chunks) {
  if (!chunks.length) return null;

  return chunks.map((c, i) => `
[FONTE ${i + 1}] ${c.categoria} — "${c.fonte_titulo}" ${c.autor ? `(${c.autor}${c.ano ? `, ${c.ano}` : ''})` : ''}
${c.artigo ? `Artigo: ${c.artigo}` : ''}
${c.titulo}: ${c.conteudo}
`.trim()).join('\n\n---\n\n');
}

// ── Gera System Prompt com contexto RAG ─────────────────
function buildSystemPrompt(contextRAG, dadosEmpresa) {
  const basePrompt = `És o Kussanguluca do Grupo Os Tira Pão — assistente financeiro inteligente da plataforma SG Kussanguluca.

IDENTIDADE:
Não és um chatbot genérico. És um consultor financeiro digital especializado em Angola, com personalidade real — directo, inteligente e empático. Fala como um amigo muito bem informado.

HIERARQUIA DE FONTES (CRÍTICO — segue sempre esta ordem):
1. BASE DE DADOS INTERNA: Se a resposta estiver nas FONTES INTERNAS abaixo, usa-as como fonte principal e cita-as explicitamente
2. CONHECIMENTO GERAL: Se não houver fontes internas suficientes, usa o teu conhecimento treinado
3. Nunca mistures fontes sem indicar a origem

COMO CITAR FONTES:
- Se usaste fonte interna: "Segundo [nome da fonte]..."
- Se usaste conhecimento geral: "Com base no meu conhecimento..."
- Se a informação não está disponível: "Não tenho essa informação na base de dados. Recomendo consultar [fonte sugerida]."

ESPECIALIDADES:
- Análise financeira (liquidez, margens, ROI, cashflow, auditoria)
- Legislação angolana (IVA, IRE, INSS, AGT, constituição de empresas)
- Estratégia para MPMEs angolanas
- Geração de relatórios detalhados quando pedido
- Ideias de negócio adaptadas ao mercado angolano

GERAÇÃO DE RELATÓRIOS:
Se o utilizador pedir um relatório, análise, auditoria ou documento, gera-o em Markdown estruturado com:
- Título e data
- Resumo executivo
- Análise detalhada por secções
- Conclusões e recomendações
- Fontes utilizadas

DADOS DA EMPRESA ACTUAL:
${dadosEmpresa ? JSON.stringify(dadosEmpresa, null, 2) : 'Sem dados da empresa nesta sessão.'}

REGRAS:
1. Nunca inventes dados financeiros — usa só os dados fornecidos
2. Avisos legais quando deres conselhos fiscais/jurídicos
3. Responde SEMPRE em português
4. Sê honesto quando não souberes algo`;

  if (contextRAG) {
    return `${basePrompt}

====== FONTES INTERNAS DA BASE DE DADOS ======
${contextRAG}
====== FIM DAS FONTES INTERNAS ======

Prioriza as informações acima nas tuas respostas.`;
  }

  return basePrompt;
}

// ── Guarda relatório gerado na BD ───────────────────────
async function guardarRelatorio(id_empresa, id_usuario, tipo, titulo, conteudo, dadosEntrada, fontesUsadas) {
  try {
    await connection.execute(
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
    return result.insertId;
  } catch (err) {
    console.error('[Kuss] Erro ao guardar relatório:', err);
  }
}

// ── Detecta se é pedido de relatório ───────────────────
function isRelatorioRequest(texto) {
  const keywords = ['relatório', 'relatorio', 'auditoria', 'análise completa', 'analise completa',
    'gera um', 'cria um', 'elabora', 'documento', 'resumo executivo', 'diagnóstico'];
  const lower = texto.toLowerCase();
  return keywords.some(k => lower.includes(k));
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

    // 1. Pesquisa RAG
    const chunks = await pesquisarConhecimento(ultimaPergunta);
    const contextRAG = chunks.length > 0 ? formatarContextoRAG(chunks) : null;

    // 2. Monta system prompt com contexto
    const systemPrompt = buildSystemPrompt(contextRAG, contextData);

    // 3. Chama Claude via API Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,   // ← adiciona esta linha
    'anthropic-version': '2023-06-01',              // ← e esta também
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

    // 4. Se for relatório, guarda na BD
    if (isRelatorioRequest(ultimaPergunta) && id_empresa) {
      const tipoRelatorio = detectarTipoRelatorio(ultimaPergunta);
      await guardarRelatorio(
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
        [
          id_usuario || null,
          id_empresa || null,
          ultimaPergunta,
          resposta,
          JSON.stringify(chunks.map(c => c.id_chunk))
        ]
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

// ── GET /kuss/relatorios — lista relatórios gerados ─────
export async function listarRelatorios(req, res) {
  try {
    const id_empresa = req.query.id_empresa || req.usuario?.id_empresa;
    if (!id_empresa) return res.status(400).json({ error: 'id_empresa obrigatório' });

    const [rows] = await connection.execute(
      `SELECT id_relatorio, tipo, titulo, criado_em
       FROM kb_relatorio_ia
       WHERE id_empresa = ?
       ORDER BY criado_em DESC
       LIMIT 20`,
      [id_empresa]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET /kuss/relatorios/:id — descarrega relatório ─────
export async function obterRelatorio(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await connection.execute(
      `SELECT * FROM kb_relatorio_ia WHERE id_relatorio = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Relatório não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET /kuss/fontes — lista fontes disponíveis ─────────
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

// ── POST /kuss/conhecimento — adiciona chunk manual ─────
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

// ── Helper ───────────────────────────────────────────────
function detectarTipoRelatorio(texto) {
  const t = texto.toLowerCase();
  if (t.includes('auditoria')) return 'auditoria';
  if (t.includes('liquidez') || t.includes('financeiro')) return 'analise_financeira';
  if (t.includes('fiscal') || t.includes('imposto')) return 'analise_fiscal';
  if (t.includes('estratégia') || t.includes('negócio')) return 'estrategia';
  return 'relatorio_geral';
}








// GET /kuss/relatorios/:id/pdf
export async function exportarRelatorioPDF(req, res) {
  const [rows] = await connection.query(
    `SELECT * FROM kb_relatorio_ia WHERE id_relatorio = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });

  const rel = rows[0];
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-${rel.id_relatorio}.pdf"`);
  doc.pipe(res);

  // Cabeçalho
  doc.fontSize(20).font('Helvetica-Bold').text('SG Kussanguluca', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text(rel.titulo, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Gerado em: ${new Date(rel.criado_em).toLocaleDateString('pt-AO')}`);
  doc.moveDown();

  // Conteúdo (remove markdown básico)
  const texto = rel.conteudo.replace(/\*\*/g, '').replace(/#{1,3} /g, '');
  doc.fontSize(11).font('Helvetica').text(texto, { lineGap: 4 });

  doc.end();
}

// GET /kuss/relatorios/:id/excel
export async function exportarRelatorioExcel(req, res) {
  const [rows] = await connection.query(
    `SELECT * FROM kb_relatorio_ia WHERE id_relatorio = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });

  const rel = rows[0];
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Relatório');

  // Estilo cabeçalho
  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = rel.titulo;
  ws.getCell('A1').font = { bold: true, size: 14 };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.getCell('A2').value = `Gerado em: ${new Date(rel.criado_em).toLocaleDateString('pt-AO')}`;

  ws.addRow([]);

  // Conteúdo linha a linha
  const linhas = rel.conteudo.split('\n');
  linhas.forEach(linha => {
    const row = ws.addRow([linha.replace(/\*\*/g, '').replace(/#{1,3} /g, '')]);
    if (linha.startsWith('## ') || linha.startsWith('### ')) {
      row.getCell(1).font = { bold: true };
    }
  });

  ws.getColumn(1).width = 100;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-${rel.id_relatorio}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}