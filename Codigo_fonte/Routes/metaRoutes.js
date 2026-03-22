import express from 'express';
import {
  listarMetas, metaActual, criarMeta,
  actualizarMeta, eliminarMeta
} from '../Controllers/metaController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';
 
const router = express.Router();
 
router.get('/',        authMiddleware, listarMetas);
router.get('/actual',  authMiddleware, metaActual);
router.post('/',       authMiddleware, criarMeta);
router.put('/:id',     authMiddleware, actualizarMeta);
router.delete('/:id',  authMiddleware, eliminarMeta);
 
export default router;