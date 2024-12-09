/**
 * Base class for LLM-powered services in the Insight Engine
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';

export interface LLMResponse<T> {
	result: T;
	error?: string;
}

export abstract class BaseLLMService<T> {
	protected model: BaseChatModel;
	protected isProcessing: boolean = false;

	constructor(model: BaseChatModel) {
		this.model = model;
	}

	/**
	 * Process content using the LLM model
	 * @param content The content to process
	 * @returns Promise<LLMResponse<T>> containing the processed result or error
	 */
	protected async processWithLLM(
		content: string,
		systemPrompt: string,
		parseResponse: (response: string) => T
	): Promise<LLMResponse<T>> {
		console.log('BaseLLMService: Starting LLM processing');

		if (this.isProcessing) {
			console.warn('BaseLLMService: Another request is already being processed');
			return {
				result: null as T,
				error: 'Another request is currently being processed',
			};
		}

		try {
			this.isProcessing = true;
			console.log('BaseLLMService: Sending request to LLM');
			console.log('BaseLLMService: System prompt:', systemPrompt);
			console.log('BaseLLMService: User content length:', content.length);

			const response = await this.model.invoke([
				new SystemMessage(systemPrompt),
				new HumanMessage(content),
			]);

			console.log('BaseLLMService: Received response from LLM');
			const responseContent = response.content.toString();
			console.log('BaseLLMService: Raw response:', responseContent);

			console.log('BaseLLMService: Parsing response');
			const result = parseResponse(responseContent);
			console.log('BaseLLMService: Parsed result:', result);

			return { result };
		} catch (error) {
			console.error('BaseLLMService: Error processing content:', error);
			if (
				error instanceof Error &&
				(error.message.includes('ECONNREFUSED') ||
					error.message.includes('Failed to fetch'))
			) {
				console.error('BaseLLMService: Connection error - Ollama server not accessible');
				return {
					result: null as T,
					error: 'Unable to connect to Ollama server. Please make sure it is running and accessible.',
				};
			}
			if (
				error instanceof Error &&
				(error.message.toLowerCase().includes('rate limit') ||
					error.message.toLowerCase().includes('resource_exhausted'))
			) {
				console.error('BaseLLMService: Rate limit exceeded');
				return {
					result: null as T,
					error: 'Rate limit exceeded. Please wait a few minutes before trying again.',
				};
			}
			console.error('BaseLLMService: Generic error:', error.message);
			return {
				result: null as T,
				error: 'Failed to process content: ' + error.message,
			};
		} finally {
			this.isProcessing = false;
			console.log('BaseLLMService: Processing completed');
		}
	}

	/**
	 * Process content using the LLM model with a prompt template
	 * @param content The content to process
	 * @param promptTemplate The prompt template to use
	 * @param parseResponse Function to parse the LLM response
	 * @returns Promise<LLMResponse<T>> containing the processed result or error
	 */
	protected async processWithTemplate(
		content: string,
		promptTemplate: PromptTemplate,
		parseResponse: (response: string) => T
	): Promise<LLMResponse<T>> {
		if (this.isProcessing) {
			return {
				result: null as T,
				error: 'Another request is currently being processed',
			};
		}

		try {
			this.isProcessing = true;

			const prompt = await promptTemplate.format({ text: content });
			const response = await this.model.invoke([new HumanMessage(prompt)]);

			const responseContent = response.content.toString();
			const result = parseResponse(responseContent);
			return { result };
		} catch (error) {
			console.error('Error processing content:', error);
			if (
				error instanceof Error &&
				(error.message.includes('ECONNREFUSED') ||
					error.message.includes('Failed to fetch'))
			) {
				return {
					result: null as T,
					error: 'Unable to connect to Ollama server. Please make sure it is running and accessible.',
				};
			}
			if (
				error instanceof Error &&
				(error.message.toLowerCase().includes('rate limit') ||
					error.message.toLowerCase().includes('resource_exhausted'))
			) {
				return {
					result: null as T,
					error: 'Rate limit exceeded. Please wait a few minutes before trying again.',
				};
			}
			return {
				result: null as T,
				error: 'Failed to process content: ' + error.message,
			};
		} finally {
			this.isProcessing = false;
		}
	}
}
