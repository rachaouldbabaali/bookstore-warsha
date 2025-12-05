import express from 'express';
import Book from '../Models/Book.js';
import bookRoutes from './bookRoutes.js';

const router = express.Router();

// Use book routes
router.use('/books', bookRoutes);

export default router;