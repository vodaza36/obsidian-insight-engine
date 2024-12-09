// Mock declarations must be at the top level
vi.mock('obsidian', () => ({
	Notice: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteSummaryService, SummaryResult } from '../../../src/services/noteSummary';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Notice } from 'obsidian';

describe('NoteSummaryService', () => {
	let service: NoteSummaryService;
	let mockModel: BaseChatModel;

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();

		// Create a mock LLM model
		mockModel = {
			invoke: vi.fn().mockResolvedValue({ content: 'Mocked summary' }),
		} as unknown as BaseChatModel;

		// Create a new service instance with the mock model
		service = new NoteSummaryService(mockModel);

		// Mock the clipboard API
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: vi.fn(),
			},
			writable: true,
		});
	});

	describe('generateSummary', () => {
		it('should generate a summary successfully', async () => {
			// Given: a note content
			const noteContent = 'This is a test note content';
			const expectedSummary = 'Mocked summary';

			// When: generating a summary
			const result = await service.generateSummary(noteContent);

			// Then: it should return the expected summary
			expect(result).toEqual({ summary: expectedSummary });
			expect(mockModel.invoke).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ content: expect.any(String) }), // system message
					expect.objectContaining({ content: noteContent }), // user message
				])
			);
		});

		it('should prevent concurrent processing', async () => {
			// Given: a long-running summary generation
			const noteContent = 'Test content';
			mockModel.invoke = vi
				.fn()
				.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

			// When: trying to generate summaries concurrently
			const firstCall = service.generateSummary(noteContent);
			const secondCall = service.generateSummary(noteContent);

			// Then: the second call should return an error
			const secondResult = await secondCall;
			expect(secondResult.error).toBe('Another request is currently being processed');
			expect(secondResult.summary).toBe('');

			// Clean up: wait for the first call to complete
			await firstCall;
		});

		it('should handle errors during summary generation', async () => {
			// Given: a failing summary generation
			const noteContent = 'Test content';
			const errorMessage = 'Model error';
			mockModel.invoke = vi.fn().mockRejectedValue(new Error(errorMessage));

			// When: generating a summary
			const result = await service.generateSummary(noteContent);

			// Then: it should return an error
			expect(result.error).toBe('Failed to process content: ' + errorMessage);
			expect(result.summary).toBe('');
		});

		it('should handle complex message content', async () => {
			// Given: a note content and a mock response with complex content
			const noteContent = 'This is a test note content';
			const complexContent = ['Part 1', 'Part 2'];
			mockModel.invoke = vi.fn().mockResolvedValue({ content: complexContent });

			// When: generating a summary
			const result = await service.generateSummary(noteContent);

			// Then: it should convert the complex content to string
			expect(result).toEqual({ summary: complexContent.toString() });
		});
	});

	describe('copyToClipboard', () => {
		it('should copy text to clipboard successfully', async () => {
			// Given: some text to copy
			const text = 'Text to copy';
			const clipboard = navigator.clipboard;

			// When: copying to clipboard
			const result = await service.copyToClipboard(text);

			// Then: it should copy successfully
			expect(result).toBe(true);
			expect(clipboard.writeText).toHaveBeenCalledWith(text);
			expect(Notice).toHaveBeenCalledWith('Summary copied to clipboard');
		});

		it('should handle clipboard errors', async () => {
			// Given: a failing clipboard
			const text = 'Text to copy';
			const clipboard = navigator.clipboard;
			clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'));

			// When: copying to clipboard
			const result = await service.copyToClipboard(text);

			// Then: it should handle the error
			expect(result).toBe(false);
			expect(Notice).toHaveBeenCalledWith('Failed to copy to clipboard');
		});
	});
});
