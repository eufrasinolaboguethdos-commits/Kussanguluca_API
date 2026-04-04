import express from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import {
  kussChat,
  listarRelatorios,
  obterRelatorio,
  listarFontes,
  adicionarConhecimento,
} from '../Controllers/kussController.js';
import { exportarRelatorioPDF, exportarRelatorioExcel } from '../Controllers/kussController.js';



const router = express.Router();

router.post('/chat',               authMiddleware, kussChat);
router.get('/relatorios',          authMiddleware, listarRelatorios);
router.get('/relatorios/:id',      authMiddleware, obterRelatorio);
router.get('/fontes',              authMiddleware, listarFontes);
router.post('/conhecimento',       authMiddleware, adicionarConhecimento);
router.get('/kuss/relatorios/:id/pdf', authMiddleware, exportarRelatorioPDF);
router.get('/kuss/relatorios/:id/excel', authMiddleware, exportarRelatorioExcel);

export default router;