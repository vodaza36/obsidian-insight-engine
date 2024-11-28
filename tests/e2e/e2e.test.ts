import { describe, it, expect } from 'vitest';
import { TagGenerator } from '../../src/services/tagGenerator';
import { LLMFactory, LLMProvider } from '../../src/services/llmFactory';

describe('E2E Tests', () => {
    it('should suggest tags using Ollama', async () => {
        const model = LLMFactory.createModel(
            LLMProvider.OLLAMA,
            'llama3.1',
            {
                llmHost: 'http://localhost:11434',
                temperature: 0,
                maxRetries: 2
            }
        );
        const tagGenerator = new TagGenerator(model);
        
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
        expect(tags.length).toBeLessThanOrEqual(6);
        expect(tags.every(tag => tag.startsWith('#'))).toBe(true);
    }, { timeout: 30000 });
});