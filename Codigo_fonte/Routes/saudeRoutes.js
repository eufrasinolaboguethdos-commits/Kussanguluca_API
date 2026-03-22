import express from 'express';
import { obterSaude, historicoSaude } from '../Controllers/saudeController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';
 
const router = express.Router();
 
router.get('/',          authMiddleware, obterSaude);
router.get('/historico', authMiddleware, historicoSaude);
 
export default router;