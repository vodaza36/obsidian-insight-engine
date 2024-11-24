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

	private async isOllamaServerRunning(): Promise<boolean> {
		try {
			const response = await fetch(this.model.baseUrl + '/api/tags');
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	async suggestTags(file: TFile, content: string, existingTags: Set<string>, signal?: AbortSignal): Promise<string[]> {
		// Check if Ollama server is running
		const isServerRunning = await this.isOllamaServerRunning();
		if (!isServerRunning) {
			throw new Error('Ollama server is not running. Please start the Ollama server using the command: "ollama serve"');
		}

		const existingTagsList = Array.from(existingTags).join(', ');
		
		const promptTemplate = new PromptTemplate({
			template: `You are an intelligent tag suggestion system for personal note-taking. Your task is to analyze the content of a note and suggest relevant tags that describe its topics, themes, and key concepts.

Content to analyze:
{text}

Existing vault tags that you can reuse if they fit the content:
{existingTags}

Instructions:
1. First, identify the main topics, themes, and concepts from the content
2. Then, suggest 3-7 relevant tags based on these identified elements
3. Format the tags according to these rules:
   - Use noun forms instead of gerund forms (e.g., 'development' not 'developing')
   - Use known acronyms (e.g., 'ai', 'dev', 'ui')
   - Use lowercase words
   - Use / for hierarchical relationships (max 2 levels)
   - Prefer single words without hyphens
   - Reuse existing tags when they fit well

Important:
- Focus on the actual content for tag suggestions
- Do not suggest tags that aren't directly related to the content
- Do not suggest one-off tags that wouldn't be reusable
- Avoid generic tags like 'misc', 'todo', 'stuff'

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
