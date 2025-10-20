import express from 'express';
import {
    createString,
    getString,
    getAllStrings,
    filterByNaturalLanguage,
    deleteString,
} from '../controllers/api.controller';

const router = express.Router();

// POST /strings
router.post('/strings', createString);

// GET /strings/filter-by-natural-language
router.get('/strings/filter-by-natural-language', filterByNaturalLanguage);

// GET /strings/{string_value}
router.get('/strings/:value', getString);

// GET /strings
router.get('/strings', getAllStrings);

// DELETE /strings/{string_value}
router.delete('/strings/:value', deleteString);

export default router;