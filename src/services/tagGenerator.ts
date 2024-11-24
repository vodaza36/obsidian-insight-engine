import { Ollama } from '@langchain/community/llms/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
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
	private promptTemplate: PromptTemplate;

	constructor(baseUrl: string, modelName: string) {
		this.model = new Ollama({
			baseUrl,
			model: modelName,
			temperature: 0.7,
		});

		this.promptTemplate = PromptTemplate.fromTemplate(
			`Given the following note content, suggest 3-5 relevant tags that capture the main topics and themes. Tags should start with '#' and be concise. If any of the suggested tags already exist in the note, prioritize them. Avoid overly generic tags.

Note Content:
{content}

Existing Tags:
{existingTags}

Please provide the tags as a comma-separated list.`
		);
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

	async suggestTags(content: string, existingTags: Set<string> = new Set(), signal?: AbortSignal): Promise<string[]> {
		// Check if Ollama server is running
		const isServerRunning = await this.isOllamaServerRunning();
		if (!isServerRunning) {
			throw new Error('Ollama server is not running. Please start the Ollama server using the command: "ollama serve"');
		}

		const existingTagsList = Array.from(existingTags).join(', ');

		try {
			// Check if operation was cancelled
			if (signal?.aborted) {
				throw new Error('Operation cancelled');
			}

			const prompt = await this.promptTemplate.format({
				content,
				existingTags: existingTagsList || 'None',
			});

			const response = await this.model.invoke(prompt, { 
				signal,
			});

			return response
				.split(',')
				.map((tag: string) => tag.trim().toLowerCase())
				.filter((tag: string) => tag.length > 0)
				.map((tag: string) => tag.replace(/\s+/g, '-')); // Ensure spaces are replaced with hyphens

		} catch (error) {
			if (error.name === 'AbortError' || error.message === 'Operation cancelled') {
				console.log('Tag generation cancelled');
				return [];
			}
			throw error;
		}
	}
}
