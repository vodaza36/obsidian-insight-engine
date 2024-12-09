import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionGenerator } from '../../../src/services/questionGenerator';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';

describe('QuestionGenerator', () => {
	let generator: QuestionGenerator;
	let mockModel: BaseChatModel;

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();

		// Create a mock LLM model
		mockModel = {
			invoke: vi.fn().mockResolvedValue({
				content: '- What is the main concept?\n- How does this work?',
			}),
		} as unknown as BaseChatModel;

		// Create a new generator instance with the mock model
		generator = new QuestionGenerator(mockModel);
	});

	describe('generateQuestions', () => {
		it('should generate questions successfully', async () => {
			// Given: a note content
			const noteContent = 'This is a test note content';
			const expectedQuestions = ['What is the main concept?', 'How does this work?'];

			// When: generating questions
			const result = await generator.generateQuestions(noteContent);

			// Then: it should return the expected questions
			expect(result).toEqual(expectedQuestions);

			// Verify the model was called with the correct message
			const calls = (mockModel.invoke as any).mock.calls[0][0];
			expect(calls.length).toBe(1);
			expect(calls[0]).toBeInstanceOf(HumanMessage);
			expect(calls[0].content).toContain('Content to analyze:\nThis is a test note content');
		});

		it('should handle empty content gracefully', async () => {
			// Given: empty content and mock response
			const emptyContent = '';
			mockModel.invoke = vi.fn().mockResolvedValue({ content: '' });

			// When: generating questions
			const result = await generator.generateQuestions(emptyContent);

			// Then: it should return an empty array
			expect(result).toEqual([]);
			expect(mockModel.invoke).toHaveBeenCalled();
		});

		it('should throw error when LLM fails', async () => {
			// Given: a note content and mock error
			const noteContent = 'Test content';
			const errorMessage = 'LLM processing failed';
			mockModel.invoke = vi.fn().mockRejectedValue(new Error(errorMessage));

			// When/Then: generating questions should throw error
			await expect(generator.generateQuestions(noteContent)).rejects.toThrow();
		});

		it('should handle malformed LLM response', async () => {
			// Given: a note content and malformed response
			const noteContent = 'Test content';
			mockModel.invoke = vi
				.fn()
				.mockResolvedValue({ content: 'Invalid response without bullet points' });

			// When: generating questions
			const result = await generator.generateQuestions(noteContent);

			// Then: it should return an empty array
			expect(result).toEqual([]);
			expect(mockModel.invoke).toHaveBeenCalled();
		});
	});
});
