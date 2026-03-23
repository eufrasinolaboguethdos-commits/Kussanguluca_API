import express from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import {
  obterTaxaActual,
  obterHistorico,
  registarTaxa,
  eliminarTaxa,
  converter
} from '../Controllers/taxaController.js';

const router = express.Router();

router.get('/',           authMiddleware, obterTaxaActual);
router.get('/historico',  authMiddleware, obterHistorico);
router.get('/converter',  authMiddleware, converter);
router.post('/',          authMiddleware, registarTaxa);
router.delete('/:id',     authMiddleware, eliminarTaxa);

export default router;