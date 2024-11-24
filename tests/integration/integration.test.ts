import { App, TFile, Plugin, PluginManifest } from 'obsidian';
import TagAgent from '../../main';
import { expect, test, describe, beforeEach, afterEach, jest, it } from '@jest/globals';
import { Ollama } from 'langchain/llms/ollama';

// Mock LangChain's Ollama class
jest.mock('langchain/llms/ollama', () => {
    return {
        Ollama: jest.fn().mockImplementation(({ baseUrl, model }) => ({
            baseUrl,
            model,
            call: jest.fn().mockImplementation((prompt: string) => {
                // Return different responses based on the content in the prompt
                if (prompt.includes('TypeScript generics')) {
                    return Promise.resolve('typescript, programming, generics, type-safety, development, software-engineering');
                } else if (prompt.includes('garden')) {
                    return Promise.resolve('gardening, plants, vegetables, outdoor-activities, nature, home-garden');
                } else {
                    return Promise.resolve('test-tag-1, test-tag-2, test-tag-3, test-tag-4, test-tag-5');
                }
            })
        }))
    };
});

// Mock manifest for plugin initialization
const mockManifest: PluginManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    minAppVersion: '0.15.0',
    author: 'Test Author',
    description: 'Test Description',
};

// Mock TFile for testing
const createMockFile = (content: string): TFile => ({
    path: 'test.md',
    name: 'test.md',
    vault: {
        read: async () => content,
        modify: async () => {}
    } as any,
    basename: 'test',
    extension: 'md',
    parent: null,
    stat: {
        ctime: 0,
        mtime: 0,
        size: 0
    }
} as TFile);

// Mock App for testing
const mockApp = {
    vault: {
        read: async (file: TFile) => {
            return (file as any).vault.read();
        },
        modify: async (file: TFile, content: string) => {
            return (file as any).vault.modify(content);
        }
    }
} as App;

describe('TagAgent Integration Tests', () => {
    let plugin: TagAgent;

    beforeEach(async () => {
        plugin = new TagAgent(mockApp, mockManifest);
        await plugin.loadSettings();
        // Access private method through type assertion
        (plugin as any).initializeLangChain();
    });

    afterEach(() => {
        plugin = undefined as any;
        jest.clearAllMocks();
    });

    it('should generate tags for TypeScript content', async () => {
        const content = `
            # Understanding TypeScript Generics
            
            TypeScript generics provide a way to make components work with any data type.
            They help us create reusable components while maintaining type safety.
            
            ## Key Concepts
            - Type variables
            - Generic constraints
            - Generic interfaces
        `;
        
        const file = createMockFile(content);
        // Access private method through type assertion
        const tags = await (plugin as any).suggestTags(file, content);
        
        expect(tags).toBeDefined();
        expect(tags.length).toBeGreaterThanOrEqual(5);
        expect(tags.length).toBeLessThanOrEqual(7);
        
        // Check if suggested tags are relevant to TypeScript content
        const tagsString = tags.join(' ');
        expect(tagsString).toMatch(/typescript|programming|development/);
    });

    it('should generate tags for garden content', async () => {
        const content = `
            # My Garden Journal
            
            Today I planted new tomatoes and basil in the vegetable garden.
            The weather was perfect for gardening, sunny but not too hot.
            I also noticed that the roses are starting to bloom.
        `;
        
        const file = createMockFile(content);
        // Access private method through type assertion
        const tags = await (plugin as any).suggestTags(file, content);
        
        expect(tags).toBeDefined();
        expect(tags.length).toBeGreaterThanOrEqual(5);
        expect(tags.length).toBeLessThanOrEqual(7);
        
        // Check if suggested tags are relevant to gardening content
        const tagsString = tags.join(' ');
        expect(tagsString).toMatch(/garden|plants|nature/);
    });

    it('should generate default tags for other content', async () => {
        const content = 'Test content for default tags';
        const file = createMockFile(content);
        // Access private method through type assertion
        const tags = await (plugin as any).suggestTags(file, content);
        
        expect(tags).toBeDefined();
        expect(tags.length).toBeGreaterThanOrEqual(5);
        expect(tags.length).toBeLessThanOrEqual(7);
    });

    it('should handle empty content gracefully', async () => {
        const content = '';
        const file = createMockFile(content);
        // Access private method through type assertion
        const tags = await (plugin as any).suggestTags(file, content);
        
        expect(tags).toBeDefined();
        expect(Array.isArray(tags)).toBe(true);
    });

    it('should generate tags in correct format', async () => {
        const content = 'Test content for tag formatting';
        const file = createMockFile(content);
        // Access private method through type assertion
        const tags = await (plugin as any).suggestTags(file, content) as string[];
        
        // Verify tag format rules
        tags.forEach((tag: string) => {
            // Should be lowercase
            expect(tag).toBe(tag.toLowerCase());
            // Should use dashes for multi-word tags
            expect(tag).not.toContain(' ');
            // Should not contain # symbol
            expect(tag).not.toContain('#');
        });
    });

    it('should initialize LangChain with settings', () => {
        const pluginInstance = plugin as any;
        expect(pluginInstance.model).toBeDefined();
        expect(pluginInstance.model.baseUrl).toBe(pluginInstance.settings.ollamaHost);
        expect(pluginInstance.model.model).toBe(pluginInstance.settings.ollamaModel);
        expect(Ollama).toHaveBeenCalledWith({
            baseUrl: 'http://localhost:11434',
            model: 'llama3.1'
        });
    });
});
