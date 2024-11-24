import { Ollama } from 'langchain/llms/ollama';
import { PromptTemplate } from 'langchain/prompts';
import { TFile } from 'obsidian';
import * as http from 'http';

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
		return new Promise((resolve) => {
			const req = http.get(this.model.baseUrl + '/api/version', (res) => {
				resolve(res.statusCode === 200);
			});

			req.on('error', () => {
				resolve(false);
			});

			req.end();
		});
	}

	async suggestTags(content: string, existingTags: Set<string>, signal?: AbortSignal): Promise<string[]> {
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
1. Analyze the content and suggest 3-5 relevant tags
2. Each tag should start with '#'
3. If an existing tag fits, use it instead of creating a new one
4. Keep tags concise (1-2 words)
5. Avoid overly generic tags
6. Return only the tags as a comma-separated list, no other text

Example output: #ai, #machine-learning, #data-science`,
			inputVariables: ['text', 'existingTags'],
		});

		try {
			const prompt = await promptTemplate.format({
				text: content,
				existingTags: existingTagsList || 'No existing tags',
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
			throw error;
		}
	}
}
