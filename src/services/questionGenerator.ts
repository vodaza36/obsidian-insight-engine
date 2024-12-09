/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseLLMService, LLMResponse } from './base/BaseLLMService';

/**
 * QuestionGenerator class is responsible for generating relevant questions from note content
 * using LLM models. It analyzes the content and generates questions that help in understanding
 * and recall of the material.
 *
 * @example
 * ```typescript
 * const model = LLMFactory.createModel(LLMProvider.OLLAMA, 'llama2');
 * const generator = new QuestionGenerator(model);
 * const questions = await generator.generateQuestions('Note content');
 * ```
 */
export class QuestionGenerator extends BaseLLMService<string[]> {
	private promptTemplate: PromptTemplate;
	private outputParser: StringOutputParser;

	/**
	 * Creates a new QuestionGenerator instance
	 * @param model - The LLM model to use for question generation
	 */
	constructor(model: BaseChatModel) {
		super(model);

		// Initialize prompt template with question generation rules
		this.promptTemplate = new PromptTemplate({
			template: `You are a question generation system. Analyze the following content and generate relevant questions that can be derived from it.

Content to analyze:
{text}

Rules for question generation:
1. Generate between 0 and 10 questions, depending on the content's information density
2. Questions should be directly answerable from the content provided
3. Focus on key concepts, relationships, and important details
4. Prioritize questions that promote understanding and recall
5. If the content doesn't contain enough information, return an empty list
6. Format questions as a Markdown list, with each question on a new line starting with "-"

IMPORTANT: Return ONLY the questions in Markdown list format. Do not include any additional text, explanations, or other content.
Example output format:
- What is the main concept discussed in this note?
- How does X relate to Y in the given context?`,
			inputVariables: ['text'],
		});

		this.outputParser = new StringOutputParser();
	}

	/**
	 * Generates questions based on the given note content
	 * @param content - The note content to analyze
	 * @returns Promise<string[]> Array of generated questions
	 * @throws Error if the LLM fails to generate questions or returns invalid format
	 */
	async generateQuestions(content: string): Promise<string[]> {
		const response = await this.processWithTemplate(content, this.promptTemplate, (content) =>
			content
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.startsWith('-'))
				.map((line) => line.substring(1).trim())
		);

		if (response.error) {
			throw new Error(response.error);
		}

		return response.result;
	}
}
