/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';

/**
 * Enumeration of supported LLM providers
 * @enum {string}
 */
export enum LLMProvider {
	/** OpenAI's cloud-based language models (requires API key) */
	OPENAI = 'openai',
	/** Ollama's local language models (requires local installation) */
	OLLAMA = 'ollama',
}

/**
 * Factory class for creating and configuring Language Model instances.
 * Supports both cloud-based (OpenAI) and local (Ollama) language models.
 *
 * @example
 * ```typescript
 * // Create an OpenAI model instance
 * const openAiModel = LLMFactory.createModel(
 *   LLMProvider.OPENAI,
 *   'gpt-3.5-turbo',
 *   { apiKey: 'your-api-key' }
 * );
 *
 * // Create an Ollama model instance
 * const ollamaModel = LLMFactory.createModel(
 *   LLMProvider.OLLAMA,
 *   'llama2',
 *   { llmHost: 'http://localhost:11434' }
 * );
 * ```
 */
export class LLMFactory {
	/**
	 * Validates the configuration settings for the specified LLM provider
	 * @param provider - The LLM provider to validate configuration for
	 * @param settings - Configuration settings for the provider
	 * @returns null if valid, error message string if invalid
	 */
	static validateConfig(provider: LLMProvider, settings: Record<string, any>): string | null {
		switch (provider) {
			case LLMProvider.OPENAI:
				if (!settings.apiKey) {
					return 'OpenAI API key is required. Please configure it in the settings.';
				}
				break;
			case LLMProvider.OLLAMA:
				if (!settings.llmHost) {
					return 'Ollama host URL is required. Please configure it in the settings.';
				}
				break;
		}
		return null;
	}

	/**
	 * Creates a new language model instance based on the specified provider and configuration
	 * @param provider - The LLM provider to use (OpenAI or Ollama)
	 * @param modelName - Name of the model to use (e.g., 'gpt-3.5-turbo' for OpenAI or 'llama2' for Ollama)
	 * @param options - Provider-specific configuration options
	 * @returns BaseChatModel A configured language model instance
	 * @throws Error if the configuration is invalid or model creation fails
	 */
	static createModel(
		provider: LLMProvider,
		modelName: string,
		options: Record<string, any> = {}
	): BaseChatModel {
		// Validate configuration before creating model
		const validationError = this.validateConfig(provider, options);
		if (validationError) {
			throw new Error(validationError);
		}

		switch (provider) {
			case LLMProvider.OPENAI:
				return new ChatOpenAI({
					modelName,
					openAIApiKey: options.apiKey,
					...options,
				});
			case LLMProvider.OLLAMA:
				return new ChatOllama({
					model: modelName,
					...options,
				});
			default:
				throw new Error(`Unsupported LLM provider: ${provider}`);
		}
	}
}
