import { analyzeString, parseNaturalLanguageQuery } from '../utils/utils';

describe('analyzeString', () => {
    it('should analyze a simple string', () => {
        const result = analyzeString('hello');
        expect(result.length).toBe(5);
        expect(result.isPalindrome).toBe(false);
        expect(result.uniqueCharacters).toBe(4); // h,e,l,o
        expect(result.wordCount).toBe(1);
        expect(result.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
        expect(result.characterFrequencyMap).toEqual({
            h: 1,
            e: 1,
            l: 2,
            o: 1,
        });
    });

    it('should detect palindrome', () => {
        const result = analyzeString('A man a plan a canal Panama');
        expect(result.isPalindrome).toBe(true);
    });

    it('should handle empty string', () => {
        const result = analyzeString('');
        expect(result.length).toBe(0);
        expect(result.isPalindrome).toBe(true);
        expect(result.uniqueCharacters).toBe(0);
        expect(result.wordCount).toBe(0);
    });

    it('should count words correctly', () => {
        const result = analyzeString('hello world test');
        expect(result.wordCount).toBe(3);
    });

    it('should handle special characters', () => {
        const result = analyzeString('hello!');
        expect(result.length).toBe(6);
        expect(result.uniqueCharacters).toBe(5);
        expect(result.characterFrequencyMap['!']).toBe(1);
    });
});

describe('parseNaturalLanguageQuery', () => {
    it('should parse "all single word palindromic strings"', () => {
        const result = parseNaturalLanguageQuery(
            'all single word palindromic strings'
        );
        expect(result).toEqual({
            wordCount: 1,
            isPalindrome: true,
        });
    });

    it('should parse "strings longer than 10 characters"', () => {
        const result = parseNaturalLanguageQuery(
            'strings longer than 10 characters'
        );
        expect(result).toEqual({
            minLength: 11,
        });
    });

    it('should parse "palindromic strings that contain the first vowel"', () => {
        const result = parseNaturalLanguageQuery(
            'palindromic strings that contain the first vowel'
        );
        expect(result).toEqual({
            isPalindrome: true,
            containsCharacter: 'a',
        });
    });

    it('should parse "strings containing the letter z"', () => {
        const result = parseNaturalLanguageQuery(
            'strings containing the letter z'
        );
        expect(result).toEqual({
            containsCharacter: 'z',
        });
    });

    it('should return null for unrecognized query', () => {
        const result = parseNaturalLanguageQuery('random query');
        expect(result).toBeNull();
    });

    it('should handle "shorter than"', () => {
        const result = parseNaturalLanguageQuery(
            'strings shorter than 5 characters'
        );
        expect(result).toEqual({
            maxLength: 4,
        });
    });

    it('should handle exact length', () => {
        const result = parseNaturalLanguageQuery('strings with 10 characters');
        expect(result).toEqual({
            minLength: 10,
            maxLength: 10,
        });
    });
});
