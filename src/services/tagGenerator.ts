import { PromptTemplate } from '@langchain/core/prompts';
import { Ollama } from '@langchain/community/llms/ollama';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import fetch from 'node-fetch';

/**
 * TagGenerator class is responsible for generating tags for notes using the Ollama language model.
 */
export class TagGenerator {
    private baseUrl: string;
    private modelName: string;
    private promptTemplate: PromptTemplate;
    private chain: RunnableSequence;
    private model: Ollama;

    constructor(baseUrl: string, modelName: string) {
        this.baseUrl = baseUrl;
        this.modelName = modelName;
        this.model = new Ollama({
            baseUrl: this.baseUrl,
            model: this.modelName,
        });
        
        this.promptTemplate = PromptTemplate.fromTemplate(
            `Given the following note content, suggest 3-5 relevant tags that capture the main topics and themes. Tags should start with '#' and be concise. If any of the suggested tags already exist in the note, prioritize them. Avoid overly generic tags.

Note Content:
{content}

Existing Tags:
{existingTags}

Please provide the tags as a comma-separated list.`
        );

        // Create the chain
        this.chain = RunnableSequence.from([
            this.promptTemplate,
            this.model,
            new StringOutputParser(),
        ]);
    }

    public async isOllamaServerRunning(): Promise<boolean> {
        try {
            // Make a simple call to test if the server is responsive
            await fetch(`${this.baseUrl}/api/version`);
            return true;
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
            const result = await this.chain.invoke({
                content,
                existingTags: existingTagsList || 'None',
            });

            console.log('Raw Ollama response:', result);

            return result
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
