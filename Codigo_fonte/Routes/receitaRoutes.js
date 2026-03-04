import express from 'express';
import { criar, listar, buscarPorId, atualizar, deletar } from '../Controllers/receitaController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const router = express.Router();



router.post('/', authMiddleware, criar);
router.get('/', authMiddleware, listar);
router.get('/:id', authMiddleware, buscarPorId);
router.put('/:id', authMiddleware, atualizar);
router.delete('/:id', authMiddleware, deletar);


export default router;