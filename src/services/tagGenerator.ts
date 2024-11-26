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
            Focus on the main topics, concepts, and categories that would help in finding this content later.

Content to analyze:
{text}

Existing tags:
{existingTags}

Rules for tag suggestions:
1. Provide at a maximum 5 relevant tags
2. Use lowercase words only
3. For multi-word tags, use dashes (e.g., 'artificial-intelligence')
4. Focus on content-specific tags, avoid generic tags
5. Tags should be specific enough to be useful but general enough to be reusable
6. Prioritize using existing tags if they fit the content well
7. Only suggest new tags if no existing tags adequately describe the content

Provide your response as a comma-separated list of tags (without the # symbol).

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
            return [];
        }
    }
}
