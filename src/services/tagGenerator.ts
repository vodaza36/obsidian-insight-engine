import { PromptTemplate } from '@langchain/core/prompts';
import * as http from 'http';
import fetch from 'node-fetch';

/**
 * TagGenerator class is responsible for generating tags for notes using the Ollama language model.
 */
interface OllamaResponse {
    response: string;
}

export class TagGenerator {
    private baseUrl: string;
    private modelName: string;
    private promptTemplate: PromptTemplate;

    constructor(baseUrl: string, modelName: string) {
        this.baseUrl = baseUrl;
        this.modelName = modelName;
        this.promptTemplate = PromptTemplate.fromTemplate(
            `Given the following note content, suggest 3-5 relevant tags that capture the main topics and themes. Tags should start with '#' and be concise. If any of the suggested tags already exist in the note, prioritize them. Avoid overly generic tags.

Note Content:
{content}

Existing Tags:
{existingTags}

Please provide the tags as a comma-separated list.`
        );
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

    async suggestTags(content: string, existingTags: Set<string> = new Set()): Promise<string[]> {
        // Check if Ollama server is running
        const isServerRunning = await this.isOllamaServerRunning();
        if (!isServerRunning) {
            throw new Error('Ollama server is not running. Please start the Ollama server using the command: "ollama serve"');
        }

        const existingTagsList = Array.from(existingTags).join(', ');

        try {
            const prompt = await this.promptTemplate.format({
                content,
                existingTags: existingTagsList || 'None',
            });

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.modelName,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${errorText}`);
            }

            const data = await response.json() as OllamaResponse | null;
            if (!data) {
                throw new Error('Invalid Ollama API response');
            }
            console.log('Raw Ollama response:', data);

            const generatedText = data.response;
            return generatedText
                .split(',')
                .map((tag: string) => tag.trim().toLowerCase())
                .filter((tag: string) => tag.length > 0)
                .map((tag: string) => tag.replace(/\s+/g, '-'));

        } catch (error) {
            console.error('Error in tag generation:', error);
            throw error;
        }
    }
}
