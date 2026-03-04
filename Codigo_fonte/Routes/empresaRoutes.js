import express from 'express';
import { adicionarEmpresa, obterEmpresas, obterEmpresaPorId, updateEmpresas, apagarEmpresaController } from '../Controllers/empresaController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';


const router = express.Router();

router.post('/', authMiddleware, adicionarEmpresa);
router.get('/', authMiddleware, obterEmpresas);
router.get('/:id', authMiddleware, obterEmpresaPorId);
router.put('/:id', authMiddleware, updateEmpresas);
router.delete('/:id', authMiddleware, apagarEmpresaController);

export default router;
