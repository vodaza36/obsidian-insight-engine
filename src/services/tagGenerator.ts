import { Ollama } from 'langchain/llms/ollama';
import { PromptTemplate } from 'langchain/prompts';
import { TFile } from 'obsidian';

/**
 * TagGenerator class is responsible for generating tags for notes using the Ollama language model.
 * 
 * This class provides functionality to:
 * - Initialize an Ollama model with specified host and model name.
 * - Suggest tags for a given file and its content using the Ollama model.
 * 
 * Main methods:
 * - constructor: Initializes the Ollama model with provided host and model name.
 * - suggestTags: Analyzes file content and generates relevant tags using the Ollama model.
 */

export class TagGenerator {
	private model: Ollama;

	constructor(ollamaHost: string, ollamaModel: string) {
		this.model = new Ollama({
			baseUrl: ollamaHost,
			model: ollamaModel,
		});
	}

	async suggestTags(file: TFile, content: string, existingTags: Set<string>, signal?: AbortSignal): Promise<string[]> {
		const existingTagsList = Array.from(existingTags).join(', ');
		
		const promptTemplate = new PromptTemplate({
			template: `You are a tag suggestion system. Analyze the following content and suggest relevant tags for organizing it.
           Focus on the main topics, concepts, and categories that would help in finding this content later.

Content to analyze:
{text}

Existing vault tags:
{existingTags}

Rules for tag suggestions:
1. Provide 5-7 relevant tags
2. Use lowercase words only
3. For multi-word tags, use dashes (e.g., 'artificial-intelligence')
4. Focus on content-specific tags, avoid generic tags
5. If an existing tag fits well, use it; otherwise suggest new specific tags
6. Tags should be specific enough to be useful but general enough to be reusable
7. Do not repeat existing tags unless they are highly relevant to the content

Provide your response as a comma-separated list of tags (without the # symbol).

Suggested tags:`,
			inputVariables: ['text', 'existingTags'],
		});

		try {
			const prompt = await promptTemplate.format({ 
				text: content,
				existingTags: existingTagsList || 'No existing tags'
			});
			
			// Check if operation was cancelled
			if (signal?.aborted) {
				throw new Error('Operation cancelled');
			}

			const response = await this.model.call(prompt, { signal });

			return response
				.split(',')
				.map((tag) => tag.trim().toLowerCase())
				.filter((tag) => tag.length > 0);
		} catch (error) {
			if (error.name === 'AbortError' || error.message === 'Operation cancelled') {
				console.log('Tag generation cancelled');
				return [];
			}
			console.error('Error generating tags:', error);
			return [];
		}
	}
}
