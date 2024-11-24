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
			template: `You are an intelligent tag suggestion system for personal note-taking. Analyze the following content and suggest relevant tags based on these principles:

Core Principles:
1. Consistency: Use lowercase words, hyphens for multi-word tags
2. Hierarchy: Use / for nested tags (e.g., project/web-dev)
3. Simplicity: Suggest 3-7 most relevant tags

Tag Categories to Consider:
1. Content Type: #type/[article|note|meeting|project|idea]
2. Topic Tags: Main subject matter (e.g., #programming/python, #health/nutrition)
3. Status: #status/[draft|in-progress|completed|archived]
4. Project Tags: If applicable, use #project/[project-name]
5. Context Tags: If clear from content, use #context/[personal|work|research]

Content to analyze:
{text}

Existing vault tags:
{existingTags}

Rules for tag suggestions:
1. Use noun forms instead of gerund forms for verbs (e.g., 'development' not 'developing')
2. Prefer single words without hyphens where possible
3. Follow the naming convention of existing tags - analyze and maintain consistency
4. Use known acronyms (e.g., 'ai' instead of 'artificial-intelligence', 'dev' instead of 'development')
5. Do not suggest specific tags that would only be used once
6. Use lowercase for all tags
7. Use / for hierarchical relationships (max 2 levels)
8. Prefer existing tags when they fit well
9. Include at least one content type tag (#type/...)
10. Avoid generic tags like #misc, #todo, #stuff

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
				.filter((tag) => tag.length > 0)
				.map((tag) => tag.replace(/\s+/g, '-')); // Ensure spaces are replaced with hyphens
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
