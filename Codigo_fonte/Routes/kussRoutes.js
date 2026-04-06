import express from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import {
  kussChat,
  listarRelatorios,
  obterRelatorio,
  exportarRelatorioPDF,
  exportarRelatorioExcel,
  listarFontes,
  adicionarConhecimento,
} from '../Controllers/kussController.js';

const router = express.Router();

router.post('/chat',                    authMiddleware, kussChat);
router.get('/relatorios',               authMiddleware, listarRelatorios);
router.get('/relatorios/:id',           authMiddleware, obterRelatorio);
router.get('/relatorios/:id/pdf',       authMiddleware, exportarRelatorioPDF);    // ← sem /kuss
router.get('/relatorios/:id/excel',     authMiddleware, exportarRelatorioExcel);  // ← sem /kuss
router.get('/fontes',                   authMiddleware, listarFontes);
router.post('/conhecimento',            authMiddleware, adicionarConhecimento);

export default router;