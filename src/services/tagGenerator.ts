import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Ollama } from '@langchain/ollama';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import fetch from 'node-fetch';

// Configure global fetch for Node.js environment
if (!globalThis.fetch) {
    (globalThis as any).fetch = fetch;
}

/**
 * TagGenerator class is responsible for generating tags for notes using the Ollama language model.
 */
export class TagGenerator {
    private baseUrl: string;
    private modelName: string;
    private model: Ollama;

    constructor(baseUrl: string, modelName: string) {
        this.baseUrl = baseUrl;
        this.modelName = modelName;
        this.model = new Ollama({
            baseUrl: this.baseUrl,
            model: this.modelName,
            temperature: 0,
        });
    }

    public async isOllamaServerRunning(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/version`);
            return response.ok;
        } catch (error) {
            console.error('Error checking Ollama server:', error);
            return false;
        }
    }

    async suggestTags(
        content: string, 
        existingTags: Set<string> = new Set(),
        signal?: AbortSignal
    ): Promise<string[]> {
        const isServerRunning = await this.isOllamaServerRunning();
        if (!isServerRunning) {
            throw new Error('Ollama server is not running. Please start the Ollama server using the command: "ollama serve"');
        }

        const existingTagsList = Array.from(existingTags).join(', ');

        try {
            const messages = [
                new SystemMessage(
                    `You are a tag generation assistant. Your task is to analyze content and generate 3-5 relevant tags.
Rules for tag generation:
1. Tags must start with '#'
2. Tags should be concise and descriptive
3. If suggested tags already exist in the input, prioritize them
4. Avoid overly generic tags
5. Use noun forms instead of gerunds
6. Prefer single words without hyphens
7. Use common acronyms (e.g., 'ai' instead of 'Artificial Intelligence')

Output format: Return only a comma-separated list of tags, nothing else.`
                ),
                new HumanMessage(
                    `Content: ${content}
Existing Tags: ${existingTagsList || 'None'}

Generate tags:`
                ),
            ];

            const response = await this.model.invoke(messages, {
                signal,
                callbacks: [
                    {
                        handleLLMError(err) {
                            console.error('LLM Error:', err);
                        },
                    },
                ],
            });

            // The response is already a string, no need to access .content
            if (typeof response !== 'string') {
                throw new Error('Unexpected response format from LLM');
            }

            return response
                .split(',')
                .map((tag: string) => tag.trim().toLowerCase())
                .filter((tag: string) => tag.length > 0)
                .map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`);

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Tag generation was cancelled');
            }
            console.error('Error in tag generation:', error);
            throw error;
        }
    }
}
