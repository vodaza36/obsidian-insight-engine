/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { LLMProvider } from '../services/llmFactory';

/**
 * Configuration settings for the Insight Engine plugin
 * @interface
 */
export interface InsightEngineSettings {
	/** The language model provider to use (OpenAI or Ollama) */
	llmProvider: LLMProvider;

	/** Name of the model to use (e.g., 'gpt-3.5-turbo' for OpenAI or 'llama2' for Ollama) */
	modelName: string;

	/** Host URL for Ollama (e.g., 'http://localhost:11434') */
	llmHost?: string;

	/** API key for OpenAI */
	apiKey?: string;

	/** Format for storing tags: 'property' for YAML frontmatter or 'line' for inline */
	tagFormat: 'property' | 'line';

	/** Position where tags should be added in the note */
	tagLocation: 'top' | 'bottom';

	/** Style format for tag names */
	tagStyle:
		| 'camelCase'
		| 'PascalCase'
		| 'snake_case'
		| 'kebab-case'
		| 'Train-Case'
		| 'UPPERCASE'
		| 'lowercase';
}

/**
 * Default settings for the Insight Engine plugin
 * @constant
 */
export const DEFAULT_SETTINGS: InsightEngineSettings = {
	llmProvider: LLMProvider.OLLAMA,
	modelName: 'llama2',
	tagFormat: 'property',
	llmHost: 'http://localhost:11434',
	tagLocation: 'top',
	tagStyle: 'kebab-case',
};

/**
 * Represents a tag suggestion with confidence score
 * @interface
 */
export interface TagSuggestion {
	/** The suggested tag text */
	tag: string;

	/** Confidence score for the suggestion (0-1) */
	confidence: number;
}
