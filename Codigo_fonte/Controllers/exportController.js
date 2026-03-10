import { exec } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connection } from '../Config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '..', '..', 'scripts');

// Windows usa 'py', Linux/Mac usa 'python3'
const PYTHON = process.platform === 'win32' ? 'py' : 'python3';

async function buscarDadosRelatorio(id_empresa, dataInicio, dataFim) {
  const [empresa] = await connection.execute(
    'SELECT nome FROM empresa WHERE id_empresa = ?', [id_empresa]
  );
  const [receitas] = await connection.execute(
    `SELECT data, descricao, categoria, valor FROM Receita
     WHERE id_empresa = ? AND apagado = 0
     AND data BETWEEN ? AND ? ORDER BY data DESC`,
    [id_empresa, dataInicio, dataFim]
  );
  const [despesas] = await connection.execute(
    `SELECT data, descricao, categoria, valor FROM Despesa
     WHERE id_empresa = ? AND apagado = 0
     AND data BETWEEN ? AND ? ORDER BY data DESC`,
    [id_empresa, dataInicio, dataFim]
  );

  const totalReceitas = receitas.reduce((s, r) => s + parseFloat(r.valor || 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + parseFloat(d.valor || 0), 0);

  const formatarData = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };

  return {
    empresa: empresa[0]?.nome || 'SG Kussanguluca',
    periodo: `${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    totalReceitas,
    totalDespesas,
    receitas: receitas.map(r => ({
      ...r,
      data: formatarData(r.data),
      valor: parseFloat(r.valor || 0)
    })),
    despesas: despesas.map(d => ({
      ...d,
      data: formatarData(d.data),
      valor: parseFloat(d.valor || 0)
    }))
  };
}

// Passa dados via ficheiro JSON temporario (evita problemas com aspas no Windows)
function executarScript(scriptPath, dados, outputPath) {
  return new Promise((resolve, reject) => {
    const tmpJson = join(SCRIPTS_DIR, `tmp_${Date.now()}.json`);
    writeFileSync(tmpJson, JSON.stringify(dados), 'utf8');

    const cmd = `python "${scriptPath}" "${tmpJson}" "${outputPath}"`;
    console.log('Executando:', cmd);

    exec(cmd, { cwd: SCRIPTS_DIR }, (err, stdout, stderr) => {
      try { unlinkSync(tmpJson); } catch {}
      if (err) {
        console.error('Python stderr:', stderr);
        console.error('Python stdout:', stdout);
        return reject(new Error(stderr || err.message));
      }
      resolve();
    });
  });
}

export async function exportarExcel(req, res) {
  const tmpOutput = join(SCRIPTS_DIR, `relatorio_${Date.now()}.xlsx`);
  try {
    const { id_empresa, dataInicio, dataFim } = req.query;
    if (!id_empresa || !dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Parametros em falta: id_empresa, dataInicio, dataFim' });
    }
    const dados  = await buscarDadosRelatorio(id_empresa, dataInicio, dataFim);
    const script = join(SCRIPTS_DIR, 'gerar_excel.py');
    await executarScript(script, dados, tmpOutput);
    if (!existsSync(tmpOutput)) throw new Error('Ficheiro Excel nao foi gerado');
    const buf = readFileSync(tmpOutput);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_${dataInicio}_${dataFim}.xlsx"`);
    res.send(buf);
  } catch (err) {
    console.error('Erro exportar Excel:', err);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (existsSync(tmpOutput)) unlinkSync(tmpOutput); } catch {}
  }
}

export async function exportarPDF(req, res) {
  const tmpOutput = join(SCRIPTS_DIR, `relatorio_${Date.now()}.pdf`);
  try {
    const { id_empresa, dataInicio, dataFim } = req.query;
    if (!id_empresa || !dataInicio || !dataFim) {
      return res.status(400).json({ error: 'Parametros em falta: id_empresa, dataInicio, dataFim' });
    }
    const dados  = await buscarDadosRelatorio(id_empresa, dataInicio, dataFim);
    const script = join(SCRIPTS_DIR, 'gerar_pdf.py');
    await executarScript(script, dados, tmpOutput);
    if (!existsSync(tmpOutput)) throw new Error('Ficheiro PDF nao foi gerado');
    const buf = readFileSync(tmpOutput);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_${dataInicio}_${dataFim}.pdf"`);
    res.send(buf);
  } catch (err) {
    console.error('Erro exportar PDF:', err);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (existsSync(tmpOutput)) unlinkSync(tmpOutput); } catch {}
  }
}