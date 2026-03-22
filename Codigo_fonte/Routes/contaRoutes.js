import express from 'express';
import {
  listarContas, criarConta, actualizarConta,
  marcarComoPaga, eliminarConta, resumoContas
} from '../Controllers/contaController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';
 
const router = express.Router();
 
router.get('/',            authMiddleware, listarContas);
router.get('/resumo',      authMiddleware, resumoContas);
router.post('/',           authMiddleware, criarConta);
router.put('/:id',         authMiddleware, actualizarConta);
router.patch('/:id/pagar', authMiddleware, marcarComoPaga);
router.delete('/:id',      authMiddleware, eliminarConta);
 
export default router;