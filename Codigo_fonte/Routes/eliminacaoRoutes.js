import express from 'express';
import { pedidoEliminacao, confirmarEliminacao } from '../Controllers/eliminacaoController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/pedido',    authMiddleware, pedidoEliminacao);
router.post('/confirmar', authMiddleware, confirmarEliminacao);

export default router;