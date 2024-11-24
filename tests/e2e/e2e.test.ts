import { describe, test, expect } from '@jest/globals';
import { TagGenerator } from '../../src/services/tagGenerator';

describe('TagAgent E2E Tests', () => {
    test('should suggest tags using real Ollama implementation', async () => {
        const tagGenerator = new TagGenerator('http://localhost:11434', 'llama3.1');
        
        const noteContent = `
# Sample Note
This is a test note about artificial intelligence and machine learning.
It discusses various programming concepts and software development practices.
The note also touches on topics like data science and neural networks.
        `;
        
        const existingTags = new Set<string>(['#ai', '#programming']);
        
        const suggestedTags = await tagGenerator.suggestTags(noteContent, existingTags);
        
        expect(suggestedTags).toBeDefined();
        expect(Array.isArray(suggestedTags)).toBe(true);
        expect(suggestedTags.length).toBeGreaterThan(0);
        
        // Verify that suggested tags are strings and start with #
        suggestedTags.forEach(tag => {
            expect(typeof tag).toBe('string');
            expect(tag.startsWith('#')).toBe(true);
        });
    }, 30000); // Increased timeout for real LLM call
});