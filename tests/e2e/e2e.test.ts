import { describe, test, expect } from '@jest/globals';
import { TagGenerator } from '../../src/services/tagGenerator';
import fetch from 'node-fetch';

describe('TagAgent E2E Tests', () => {
    test('should directly test Ollama API', async () => {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.1',
                prompt: 'Hello, how are you?',
                stream: false
            })
        });
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        console.log('Direct Ollama response:', data);
    });

    test('should suggest tags using real Ollama implementation', async () => {
        const tagGenerator = new TagGenerator('http://localhost:11434', 'llama3.1');
        
        // First check if Ollama server is running
        const isServerRunning = await tagGenerator.isOllamaServerRunning();
        expect(isServerRunning).toBe(true);
        
        const noteContent = `
# Sample Note
This is a test note about artificial intelligence and machine learning.
It discusses various programming concepts and software development practices.
The note also touches on topics like data science and neural networks.
        `;
        
        const existingTags = new Set<string>(['#ai', '#programming']);
        
        try {
            const suggestedTags = await tagGenerator.suggestTags(noteContent, existingTags);
            console.log('Suggested tags:', suggestedTags);
            expect(suggestedTags).toBeDefined();
            expect(Array.isArray(suggestedTags)).toBe(true);
            expect(suggestedTags.length).toBeGreaterThan(0);
            
            // Verify that suggested tags are strings and start with #
            suggestedTags.forEach(tag => {
                expect(typeof tag).toBe('string');
                expect(tag.startsWith('#')).toBe(true);
            });
        } catch (error) {
            console.error('Error details:', error);
            // If the test fails due to Ollama server not running, mark test as skipped
            if (error.message.includes('Ollama server is not running')) {
                console.warn('Skipping test: Ollama server is not running');
                return;
            }
            throw error;
        }
    }, 30000); // Increased timeout for real LLM call
});