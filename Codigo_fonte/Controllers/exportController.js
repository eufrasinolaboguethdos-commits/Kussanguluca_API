import { exec, execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connection } from '../Config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '..', '..', 'scripts');

// ─────────────────────────────────────────────────────────────
// Detecta automaticamente o executável Python disponível
// Resolve o problema de "App Execution Alias" no Windows 11
// ─────────────────────────────────────────────────────────────
function detectarPython() {
  // Candidatos por ordem de preferência
  const candidatos = process.platform === 'win32'
    ? ['python3', 'python', 'py']
    : ['python3', 'python'];

  for (const cmd of candidatos) {
    try {
      // Testa se o comando existe e devolve uma versão real (não a Store)
      const output = execSync(`${cmd} --version`, {
        timeout: 3000,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }).toString().trim();

      // Rejeita se o "python" abrir a Microsoft Store (sem output de versão)
      if (output.startsWith('Python')) {
        console.log(`[Python] Usando: ${cmd} (${output})`);
        return cmd;
      }
    } catch {
      // Comando não encontrado ou falhou — tenta o próximo
    }
  }

  throw new Error(
    'Python não encontrado no sistema.\n' +
    'Windows: desativa os "App Execution Aliases" do Python em ' +
    'Definições → Aplicações → Aliases de execução de aplicações,\n' +
    'ou instala o Python em https://python.org e marca "Add to PATH".'
  );
}

// Detecta uma vez ao arrancar o servidor
let PYTHON;
try {
  PYTHON = detectarPython();
} catch (err) {
  console.error('AVISO:', err.message);
  // Fallback — vai falhar com mensagem clara em runtime
  PYTHON = process.platform === 'win32' ? 'python' : 'python3';
}

// ─────────────────────────────────────────────────────────────
// Busca dados do relatório na base de dados
// ─────────────────────────────────────────────────────────────
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
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  return {
    empresa: empresa[0]?.nome || 'SG Kussanguluca',
    periodo: `${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    totalReceitas,
    totalDespesas,
    receitas: receitas.map(r => ({
      ...r,
      data: formatarData(r.data),
      valor: parseFloat(r.valor || 0),
    })),
    despesas: despesas.map(d => ({
      ...d,
      data: formatarData(d.data),
      valor: parseFloat(d.valor || 0),
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Executa o script Python com os dados via ficheiro JSON temp
// ─────────────────────────────────────────────────────────────
function executarScript(scriptPath, dados, outputPath) {
  return new Promise((resolve, reject) => {
    // Valida que o script existe antes de tentar executar
    if (!existsSync(scriptPath)) {
      return reject(new Error(`Script Python não encontrado: ${scriptPath}`));
    }

    const tmpJson = join(SCRIPTS_DIR, `tmp_${Date.now()}.json`);
    writeFileSync(tmpJson, JSON.stringify(dados, null, 2), 'utf8');

    // Usa aspas duplas nos paths — compatível com Windows e Unix
    const cmd = `"${PYTHON}" "${scriptPath}" "${tmpJson}" "${outputPath}"`;
    console.log('[exportController] Executando:', cmd);

    exec(cmd, { cwd: SCRIPTS_DIR, timeout: 30000, windowsHide: true }, (err, stdout, stderr) => {
      // Limpa o JSON temporário sempre
      try { unlinkSync(tmpJson); } catch {}

      if (stdout) console.log('[Python stdout]', stdout.trim());

      if (err) {
        console.error('[Python stderr]', stderr?.trim() || '(sem stderr)');
        console.error('[Python err]', err.message);

        // Mensagem de erro legível para o utilizador
        const detalhe = stderr?.trim() || err.message || 'Erro desconhecido';
        const isAliasError = detalhe.includes('App Execution Alias') ||
                             detalhe.includes('WindowsApps') ||
                             detalhe === '';

        if (isAliasError || err.code === 9009) {
          return reject(new Error(
            'Python não está acessível no PATH do Windows.\n' +
            'Solução: Definições → Aplicações → Aliases de execução de aplicações ' +
            '→ desativa as entradas "python.exe" e "python3.exe".\n' +
            'Depois reinicia o servidor.'
          ));
        }

        return reject(new Error(detalhe));
      }

      resolve();
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Endpoint: exportar Excel
// ─────────────────────────────────────────────────────────────
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

    if (!existsSync(tmpOutput)) throw new Error('Ficheiro Excel não foi gerado pelo script Python.');

    const buf = readFileSync(tmpOutput);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_${dataInicio}_${dataFim}.xlsx"`);
    res.send(buf);

  } catch (err) {
    console.error('[exportarExcel] Erro:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (existsSync(tmpOutput)) unlinkSync(tmpOutput); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────
// Endpoint: exportar PDF
// ─────────────────────────────────────────────────────────────
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

    if (!existsSync(tmpOutput)) throw new Error('Ficheiro PDF não foi gerado pelo script Python.');

    const buf = readFileSync(tmpOutput);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_${dataInicio}_${dataFim}.pdf"`);
    res.send(buf);

  } catch (err) {
    console.error('[exportarPDF] Erro:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { if (existsSync(tmpOutput)) unlinkSync(tmpOutput); } catch {}
  }
}