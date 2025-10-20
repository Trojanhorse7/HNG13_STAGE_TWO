import { createHash } from 'crypto';

export interface StringProperties {
    length: number;
    isPalindrome: boolean;
    uniqueCharacters: number;
    wordCount: number;
    sha256Hash: string;
    characterFrequencyMap: Record<string, number>;
}

export function analyzeString(value: string): StringProperties {
    const length = value.length;

    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPalindrome = normalized === normalized.split('').reverse().join('');

    const uniqueCharacters = new Set(value.split('')).size;

    const wordCount = value
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

    const sha256Hash = createHash('sha256').update(value).digest('hex');

    const characterFrequencyMap: Record<string, number> = {};
    for (const char of value) {
        characterFrequencyMap[char] = (characterFrequencyMap[char] || 0) + 1;
    }

    return {
        length,
        isPalindrome,
        uniqueCharacters,
        wordCount,
        sha256Hash,
        characterFrequencyMap,
    };
}

export function parseNaturalLanguageQuery(query: string): Partial<{
    isPalindrome: boolean;
    minLength: number;
    maxLength: number;
    wordCount: number;
    containsCharacter: string;
}> | null {
    const lowerQuery = query.toLowerCase();

    const filters: any = {};

    // Palindrome
    if (
        lowerQuery.includes('palindrome') ||
        lowerQuery.includes('palindromic')
    ) {
        filters.isPalindrome = true;
    }

    // Word count
    if (lowerQuery.includes('single word') || lowerQuery.includes('one word')) {
        filters.wordCount = 1;
    }

    // Length
    const numMatch = lowerQuery.match(/(\d+)/);
    if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (
            lowerQuery.includes('longer than') ||
            lowerQuery.includes('greater than')
        ) {
            filters.minLength = num + 1;
        } else if (
            lowerQuery.includes('shorter than') ||
            lowerQuery.includes('less than')
        ) {
            filters.maxLength = num - 1;
        } else if (
            lowerQuery.includes('length') ||
            lowerQuery.includes('characters')
        ) {
            filters.minLength = num;
            filters.maxLength = num;
        }
    }

    // Contains character
    if (lowerQuery.includes('first vowel')) {
        filters.containsCharacter = 'a';
    } else if (lowerQuery.includes('letter z')) {
        filters.containsCharacter = 'z';
    }

    return Object.keys(filters).length > 0 ? filters : null;
}