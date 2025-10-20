import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { analyzeString, parseNaturalLanguageQuery } from '../utils/utils';

// Query schema for filtering
const querySchema = z.object({
    is_palindrome: z
        .string()
        .optional()
        .transform((val) => (val ? val === 'true' : undefined)),
    min_length: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined)),
    max_length: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined)),
    word_count: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined)),
    contains_character: z.string().optional(),
});

export const createString = async (req: Request, res: Response) => {
    try {
        const { value } = req.body;

        // 400 → Missing or invalid field
        if (value === undefined || value === null) {
            return res.status(400).json({
                error: 'Invalid request body or missing "value" field',
            });
        }

        // 422 → Wrong data type
        if (typeof value !== 'string') {
            return res.status(422).json({
                error: 'Invalid data type for "value" (must be string)',
            });
        }

        // Analyze string properties and hash
        const properties = analyzeString(value);
        const id = properties.sha256Hash;

        // Check for existing string record
        const existing = await prisma.stringAnalysis.findUnique({
            where: { id },
        });
        if (existing) {
            return res.status(409).json({ error: 'String already exists' });
        }

        // Create new string record
        const newString = await prisma.stringAnalysis.create({
            data: {
                id,
                value,
                length: properties.length,
                isPalindrome: properties.isPalindrome,
                uniqueCharacters: properties.uniqueCharacters,
                wordCount: properties.wordCount,
                sha256Hash: properties.sha256Hash,
                characterFrequencyMap: properties.characterFrequencyMap,
            },
        });

        // Respond with created string data
        res.status(201).json({
            id: newString.id,
            value: newString.value,
            properties: {
                length: properties.length,
                is_palindrome: properties.isPalindrome,
                unique_characters: properties.uniqueCharacters,
                word_count: properties.wordCount,
                sha256_hash: properties.sha256Hash,
                character_frequency_map: properties.characterFrequencyMap,
            },
            created_at: newString.createdAt,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getString = async (req: Request, res: Response) => {
    try {
        const value = decodeURIComponent(req.params.value);
        const properties = analyzeString(value);
        const id = properties.sha256Hash;

        const stringData = await prisma.stringAnalysis.findUnique({
            where: { id },
        });
        if (!stringData) {
            return res.status(404).json({ error: 'String does not exist' });
        }

        res.json({
            id: stringData.id,
            value: stringData.value,
            properties: {
                length: properties.length,
                is_palindrome: properties.isPalindrome,
                unique_characters: properties.uniqueCharacters,
                word_count: properties.wordCount,
                sha256_hash: properties.sha256Hash,
                character_frequency_map: properties.characterFrequencyMap,
            },
            created_at: stringData.createdAt,
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllStrings = async (req: Request, res: Response) => {
    try {
        const query = querySchema.parse(req.query);
        const where: any = {};

        if (query.is_palindrome !== undefined)
            where.isPalindrome = query.is_palindrome;
        if (query.min_length !== undefined)
            where.length = { ...where.length, gte: query.min_length };
        if (query.max_length !== undefined)
            where.length = { ...where.length, lte: query.max_length };
        if (query.word_count !== undefined) where.wordCount = query.word_count;
        if (query.contains_character) {
            where.characterFrequencyMap = {
                path: [query.contains_character],
                gt: 0,
            };
        }

        const strings = await prisma.stringAnalysis.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            data: strings.map((s) => ({
                id: s.id,
                value: s.value,
                properties: {
                    length: s.length,
                    is_palindrome: s.isPalindrome,
                    unique_characters: s.uniqueCharacters,
                    word_count: s.wordCount,
                    sha256_hash: s.sha256Hash,
                    character_frequency_map: s.characterFrequencyMap as Record<
                        string,
                        number
                    >,
                },
                created_at: s.createdAt,
            })),
            count: strings.length,
            filters_applied: query,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid query parameters' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const filterByNaturalLanguage = async (req: Request, res: Response) => {
    try {
        const { query } = req.query as { query: string };
        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        const parsedFilters = parseNaturalLanguageQuery(query);
        if (!parsedFilters) {
            return res
                .status(400)
                .json({ error: 'Unable to parse natural language query' });
        }

        // Check for conflicts, e.g., min_length > max_length
        if (
            parsedFilters.minLength &&
            parsedFilters.maxLength &&
            parsedFilters.minLength > parsedFilters.maxLength
        ) {
            return res.status(422).json({ error: 'Conflicting filters' });
        }

        const where: any = {};
        if (parsedFilters.isPalindrome !== undefined)
            where.isPalindrome = parsedFilters.isPalindrome;
        if (parsedFilters.minLength)
            where.length = { gte: parsedFilters.minLength };
        if (parsedFilters.maxLength)
            where.length = { ...where.length, lte: parsedFilters.maxLength };
        if (parsedFilters.wordCount) where.wordCount = parsedFilters.wordCount;
        if (parsedFilters.containsCharacter) {
            where.characterFrequencyMap = {
                path: [parsedFilters.containsCharacter],
                gt: 0,
            };
        }

        const strings = await prisma.stringAnalysis.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            data: strings.map((s) => ({
                id: s.id,
                value: s.value,
                properties: {
                    length: s.length,
                    is_palindrome: s.isPalindrome,
                    unique_characters: s.uniqueCharacters,
                    word_count: s.wordCount,
                    sha256_hash: s.sha256Hash,
                    character_frequency_map: s.characterFrequencyMap as Record<
                        string,
                        number
                    >,
                },
                created_at: s.createdAt,
            })),
            count: strings.length,
            interpreted_query: {
                original: query,
                parsed_filters: {
                    is_palindrome: parsedFilters.isPalindrome,
                    min_length: parsedFilters.minLength,
                    max_length: parsedFilters.maxLength,
                    word_count: parsedFilters.wordCount,
                    contains_character: parsedFilters.containsCharacter,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteString = async (req: Request, res: Response) => {
    try {
        const value = decodeURIComponent(req.params.value);
        const properties = analyzeString(value);
        const id = properties.sha256Hash;

        const existing = await prisma.stringAnalysis.findUnique({
            where: { id },
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'String does not exist' });
        }

        await prisma.stringAnalysis.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
