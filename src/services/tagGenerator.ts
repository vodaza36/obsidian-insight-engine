/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { BaseLLMService, LLMResponse } from './base/BaseLLMService';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { TagFormatter, TagStyle } from './tagFormatter';

/**
 * TagGenerator class is responsible for generating contextually relevant tags for notes
 * using various LLM providers (OpenAI or Ollama). It analyzes note content and suggests
 * tags that capture the main topics and concepts while following configurable formatting rules.
 *
 * @example
 * ```typescript
 * const model = LLMFactory.createModel(LLMProvider.OLLAMA, 'llama2');
 * const generator = new TagGenerator(model, 'kebab-case');
 * const tags = await generator.generateTags('My note content', ['existing-tag']);
 * ```
 */
export class TagGenerator extends BaseLLMService<string[]> {
	private tagFormatter: TagFormatter;
	private readonly outputParser = new JsonOutputParser<{ tags: string[] }>();

	private readonly systemPrompt = `You are a tag generation system. Your task is to analyze content and generate relevant tags that capture the main topics, concepts, and themes. You MUST follow these rules strictly:

1. Generate descriptive, meaningful tags
2. Focus on key topics, themes, and important concepts
3. Avoid overly generic tags
4. Use acronyms for well-known terms (e.g., "AI", "NLP", "ML")
5. Prefer existing tags when provided
6. Generate exactly 5 tags unless content is very simple or complex
7. Multi-word tags are allowed (e.g., "machine-learning", "artificial-intelligence")
8. Tags will be formatted in {tagStyle} style in the final output

IMPORTANT: You MUST return the tags in the following JSON format with no additional text or explanations:
{
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Do not include descriptions, explanations, or any other text in your response. Return only the JSON object.`;

	/**
	 * Creates a new TagGenerator instance
	 * @param model - The LLM model to use for tag generation
	 * @param tagStyle - The formatting style for generated tags (default: 'kebab-case')
	 */
	constructor(model: BaseChatModel, tagStyle: TagStyle = 'kebab-case') {
		super(model);
		this.tagFormatter = new TagFormatter(tagStyle);
	}

	/**
	 * Generates tags for the given note content while considering existing tags
	 * @param content - The note content to analyze
	 * @param existingTags - Array of tags that already exist in the note (optional)
	 * @returns Promise<string[]> Array of generated tags in the specified format
	 * @throws Error if the LLM fails to generate tags or returns invalid format
	 */
	async suggestTags(content: string, existingTags: Set<string> = new Set()): Promise<string[]> {
		console.log('TagGenerator: Starting tag generation');
		console.log('TagGenerator: Content length:', content.length);
		console.log('TagGenerator: Existing tags:', Array.from(existingTags));

		const existingTagsString =
			Array.from(existingTags)
				.map((tag) => tag.replace('#', ''))
				.join(', ') || 'None';

		console.log('TagGenerator: Formatted existing tags:', existingTagsString);

		const systemPromptWithStyle = this.systemPrompt.replace(
			'{tagStyle}',
			this.tagFormatter.getStyle()
		);
		console.log('TagGenerator: Using tag style:', this.tagFormatter.getStyle());

		const userPrompt = `Content to analyze:\n${content}\n\nExisting tags:\n${existingTagsString}`;
		console.log('TagGenerator: Generated user prompt');

		try {
			console.log('TagGenerator: Calling LLM for tag suggestions');
			const response = await this.processWithLLM(
				userPrompt,
				systemPromptWithStyle,
				(content: string): string[] => {
					console.log('TagGenerator: Raw LLM response:', content);
					let tags: string[];

					try {
						// Try parsing as JSON first
						const parsed = JSON.parse(content);
						if (!parsed.tags || !Array.isArray(parsed.tags)) {
							throw new Error('Invalid JSON format');
						}
						tags = parsed.tags;
					} catch (error) {
						console.log('TagGenerator: JSON parsing failed, using fallback parser');
						// Try to extract tags from various text formats

						// Try numbered list format (e.g., "1. Tag\n2. Another tag")
						const numberedListMatch = content.match(/\d+\.\s*([^\n]+)/g);
						if (numberedListMatch) {
							tags = numberedListMatch.map((line) =>
								line.replace(/^\d+\.\s*/, '').trim()
							);
						}
						// Try bullet points format
						else if (content.includes('*')) {
							const bulletMatch = content.match(/\*(.*?)(?=\*|$)/g);
							tags = bulletMatch
								? bulletMatch.map((tag) => tag.replace('*', '').trim())
								: [];
						}
						// Fallback to comma-separated format
						else {
							tags = content.split(',').map((tag) => tag.trim());
						}

						// Remove any header text if present
						tags = tags.map((tag) =>
							tag.replace(/^.*?(?:tags for|tags:|tags).*?:/i, '').trim()
						);
					}

					// Format tags using TagFormatter
					const formattedTags = tags
						.filter((tag) => tag) // Remove empty tags
						.filter((tag) => !tag.includes(' ')) // Filter out tags with spaces
						.map((tag) => {
							// If tag already has proper formatting (e.g., snake_case), keep it
							if (tag.includes('_') || tag.includes('-')) {
								return '#' + tag;
							}
							return this.tagFormatter.formatTag(tag);
						});

					console.log('TagGenerator: Formatted tags:', formattedTags);
					return formattedTags;
				}
			);

			if (response.error) {
				console.error('TagGenerator: Error in LLM response:', response.error);
				throw new Error(response.error);
			}

			console.log('TagGenerator: Final suggested tags:', response.result);
			return response.result;
		} catch (error) {
			console.error('TagGenerator: Error during tag generation:', error);
			throw error;
		}
	}
}
