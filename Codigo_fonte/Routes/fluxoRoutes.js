import express from 'express';
import { obterFluxo } from '../Controllers/fluxoController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';
 
const router = express.Router();
 
router.get('/', authMiddleware, obterFluxo);
 
export default router;