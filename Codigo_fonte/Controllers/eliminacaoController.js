import { connection } from '../Config/db.js';
import { enviarPedidoEliminacao, enviarCodigoUtilizador } from '../Services/emailService.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * PASSO 1 — Utilizador envia pedido com motivo
 * POST /eliminacao/pedido
 */
export async function pedidoEliminacao(req, res) {
  try {
    const { motivo } = req.body;
    const id_usuario = req.usuario.id;

    if (!motivo || motivo.trim().length < 20) {
      return res.status(400).json({
        error: 'O motivo deve ter pelo menos 20 caracteres. Por favor, explique detalhadamente.'
      });
    }

    // Buscar dados do utilizador
    const [rows] = await connection.execute(
      'SELECT nome, email FROM usuario WHERE id_usuario = ?',
      [id_usuario]
    );
    const utilizador = rows[0];
    if (!utilizador) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    // Gerar código de 6 dígitos
    const codigo = String(Math.floor(100000 + Math.random() * 900000));

    // Hash do código para guardar na BD (segurança)
    const codigoHash = await bcrypt.hash(codigo, 10);

    // Expiração: 24 horas
    const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Guardar pedido na BD
    await connection.execute(
      `INSERT INTO pedido_eliminacao (id_usuario, motivo, codigo_hash, expiracao, estado)
       VALUES (?, ?, ?, ?, 'pendente')
       ON DUPLICATE KEY UPDATE motivo = VALUES(motivo), codigo_hash = VALUES(codigo_hash), expiracao = VALUES(expiracao), estado = 'pendente'`,
      [id_usuario, motivo.trim(), codigoHash, expiracao]
    );

    // Enviar email para a equipa com o código
    await enviarPedidoEliminacao({
      nomeUtilizador: utilizador.nome,
      emailUtilizador: utilizador.email,
      motivo: motivo.trim(),
      codigo,
    });

    res.json({
      message: 'Pedido enviado com sucesso! A nossa equipa irá analisar o motivo e, se aprovado, receberá um código no seu email.'
    });

  } catch (err) {
    console.error('Erro pedido eliminação:', err);
    res.status(500).json({ error: 'Erro ao enviar pedido. Tente novamente.' });
  }
}

/**
 * PASSO 2 — Utilizador insere o código recebido por email
 * POST /eliminacao/confirmar
 */
export async function confirmarEliminacao(req, res) {
  try {
    const { codigo } = req.body;
    const id_usuario = req.usuario.id;

    if (!codigo || codigo.trim().length === 0) {
      return res.status(400).json({ error: 'Código obrigatório.' });
    }

    // Buscar pedido activo
    const [rows] = await connection.execute(
      `SELECT * FROM pedido_eliminacao
       WHERE id_usuario = ? AND estado = 'pendente' AND expiracao > NOW()`,
      [id_usuario]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'Nenhum pedido activo encontrado ou o código expirou. Submeta um novo pedido.'
      });
    }

    const pedido = rows[0];

    // Verificar código
    const codigoValido = await bcrypt.compare(codigo.trim(), pedido.codigo_hash);
    if (!codigoValido) {
      return res.status(401).json({ error: 'Código inválido. Verifique o email e tente novamente.' });
    }

    // Eliminar conta (soft delete)
    await connection.execute(
      'UPDATE usuario SET apagado = 1 WHERE id_usuario = ?',
      [id_usuario]
    );

    // Marcar pedido como concluído
    await connection.execute(
      `UPDATE pedido_eliminacao SET estado = 'concluido' WHERE id_usuario = ?`,
      [id_usuario]
    );

    res.json({ message: 'Conta eliminada com sucesso.' });

  } catch (err) {
    console.error('Erro confirmar eliminação:', err);
    res.status(500).json({ error: 'Erro ao confirmar eliminação. Tente novamente.' });
  }
}