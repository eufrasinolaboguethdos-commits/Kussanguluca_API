import express from 'express';
import { exportarExcel, exportarPDF } from '../Controllers/exportController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.get('/excel', authMiddleware, exportarExcel);
router.get('/pdf',   authMiddleware, exportarPDF);

export default router;