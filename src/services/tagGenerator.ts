import { Ollama } from 'langchain/llms/ollama';
import { PromptTemplate } from 'langchain/prompts';
import { TFile } from 'obsidian';

export class TagGenerator {
	private model: Ollama;

	constructor(ollamaHost: string, ollamaModel: string) {
		this.model = new Ollama({
			baseUrl: ollamaHost,
			model: ollamaModel,
		});
	}

	async suggestTags(file: TFile, content: string): Promise<string[]> {
		const promptTemplate = new PromptTemplate({
			template: `You are a tag suggestion system. Analyze the following content and suggest relevant tags for organizing it.
            Focus on the main topics, concepts, and categories that would help in finding this content later.

Content to analyze:
{text}

Rules for tag suggestions:
1. Provide exactly 5-7 relevant tags
2. Use lowercase words only
3. For multi-word tags, use dashes (e.g., 'artificial-intelligence')
4. Focus on content-specific tags, avoid generic tags
5. Tags should be specific enough to be useful but general enough to be reusable

Provide your response as a comma-separated list of tags (without the # symbol).

Suggested tags:`,
			inputVariables: ['text'],
		});

		try {
			const prompt = await promptTemplate.format({ text: content });
			const response = await this.model.call(prompt);

			return response
				.split(',')
				.map((tag) => tag.trim().toLowerCase())
				.filter((tag) => tag.length > 0);
		} catch (error) {
			console.error('Error generating tags:', error);
			return [];
		}
	}
}
