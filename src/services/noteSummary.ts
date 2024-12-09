import { Notice } from 'obsidian';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { BaseLLMService, LLMResponse } from './base/BaseLLMService';

export interface SummaryResult {
	summary: string;
	error?: string;
}

/**
 * NoteSummaryService class is responsible for generating concise summaries of notes
 * using LLM models. It processes note content and returns a summarized version while
 * maintaining the key points and main ideas.
 *
 * @example
 * ```typescript
 * const model = LLMFactory.createModel(LLMProvider.OLLAMA, 'llama3');
 * const service = new NoteSummaryService(model);
 * const result = await service.generateSummary('Note content to summarize');
 * ```
 */
export class NoteSummaryService extends BaseLLMService<string> {
	private readonly systemPrompt = `You are a note summarization system. Your task is to create concise, clear summaries of notes while preserving the key information and main ideas. Follow these rules:

1. Maintain the original meaning and key points
2. Use clear, concise language
3. Preserve any important technical terms
4. Keep lists and structured information
5. Format the output in Markdown
6. Focus on the most important 20% of the content that provides 80% of the value
7. Output ONLY the summary content - do not add any introductory text like "Here is a summary..." or similar phrases
8. Do not wrap the output in code blocks

Length of the summary should be proportional to the input, but generally aim for 25-33% of the original length.`;

	/**
	 * Creates a new NoteSummaryService instance
	 * @param model - The LLM model to use for summary generation
	 */
	constructor(model: BaseChatModel) {
		super(model);
	}

	/**
	 * Generates a summary of the provided note content
	 * @param noteContent The content of the note to summarize
	 * @returns Promise<SummaryResult> containing the summary or error
	 */
	async generateSummary(noteContent: string): Promise<SummaryResult> {
		const response = await this.processWithLLM(
			noteContent,
			this.systemPrompt,
			(content) => content
		);

		return {
			summary: response.result || '',
			error: response.error,
		};
	}

	/**
	 * Copies the provided text to clipboard
	 * @param text The text to copy
	 * @returns Promise<boolean> indicating success
	 */
	async copyToClipboard(text: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			new Notice('Summary copied to clipboard');
			return true;
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			new Notice('Failed to copy to clipboard');
			return false;
		}
	}
}
