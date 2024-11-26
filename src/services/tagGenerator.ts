import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * TagGenerator class is responsible for generating tags for notes using the Ollama language model.
 */
export class TagGenerator {
    private model: Ollama;
    private promptTemplate: PromptTemplate;
    private outputParser: StringOutputParser;

    constructor(ollamaHost: string, ollamaModel: string) {
        this.model = new Ollama({
            baseUrl: ollamaHost,
            model: ollamaModel,
            temperature: 0,
            maxRetries: 2
        });

        this.promptTemplate = new PromptTemplate({
            template: `You are a tag suggestion system. Analyze the following content and suggest relevant tags for organizing it.
            Focus on the main topics, concepts, and categories that would help in finding this content later. Try to follow the rules listed below in the prioritized order.

Content to analyze:
{text}

Existing tags:
{existingTags}

Rules for tag suggestions:
1. Provide at least 2 tags and at most 5 relevant tags
2. Use acronym format (e.g., 'ai' instead of 'Artificial Intelligence', or 'rag' instead of 'retrieval-augmented generation')
3. Use lowercase words only
4. Prefer single-word tags
5. For multi-word tags, use dashes (e.g., 'artificial-intelligence')
6. Focus on content-specific tags, avoid generic tags
7. Tags should be specific enough to be useful but general enough to be reusable
8. Prioritize using existing tags if they fit the content well then respond with the existing tags
9. Only suggest new tags if no existing tags adequately describe the content

Provide your response as a comma-separated list of tags (without the # symbol). Response only the tags with no additonal information.

Suggested tags:`,
            inputVariables: ['text', 'existingTags']
        });

        this.outputParser = new StringOutputParser();
    }

    async suggestTags(content: string, existingTags: Set<string> = new Set()): Promise<string[]> {
        try {
            const existingTagsString = Array.from(existingTags).join(', ') || 'None';
            const prompt = await this.promptTemplate.format({ 
                text: content,
                existingTags: existingTagsString
            });
            const chain = this.model.pipe(this.outputParser);
            const response = await chain.invoke(prompt);
            
            // Process the response into a clean array of tags
            return response
                .split(',')
                .map(tag => "#" + tag.trim().toLowerCase())
                .filter(tag => tag.length > 0);
        } catch (error) {
            console.error('Error suggesting tags:', error);
            // Check if the error is related to Ollama connection
            if (error instanceof Error && 
                (error.message.includes('ECONNREFUSED') || 
                 error.message.includes('Failed to fetch'))) {
                throw new Error('Unable to connect to Ollama server. Please make sure it is running and accessible.');
            }
            throw error;
        }
    }
}
