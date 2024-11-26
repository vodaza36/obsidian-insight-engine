import { describe, it, expect } from 'vitest';
import { TagGenerator } from '../../src/services/tagGenerator';

describe('E2E Tests', () => {
    it('should suggest tags using Ollama', async () => {
        const tagGenerator = new TagGenerator('http://localhost:11434', 'llama3.1');
        
        const noteContent = `
# Sample Note
This is a test note about artificial intelligence and machine learning.
It discusses various programming concepts and software development practices.
The note also touches on topics like data science and neural networks.
`;

        const existingTags = new Set(['#ai', '#programming']);
        const tags = await tagGenerator.suggestTags(noteContent, existingTags);

        expect(tags).toBeInstanceOf(Array);
        expect(tags.length).toBeGreaterThanOrEqual(3);
        expect(tags.length).toBeLessThanOrEqual(5);
        expect(tags.every(tag => tag.startsWith('#'))).toBe(true);
    }, { timeout: 30000 });
});