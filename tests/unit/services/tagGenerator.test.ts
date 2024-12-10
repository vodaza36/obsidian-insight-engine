import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagGenerator } from '../../../src/services/tagGenerator';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

describe('TagGenerator', () => {
	let generator: TagGenerator;
	let mockModel: BaseChatModel;

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();

		// Create a mock LLM model
		mockModel = {
			invoke: vi.fn().mockResolvedValue({
				content: JSON.stringify({
					tags: ['typescript', 'web-development', 'testing'],
				}),
			}),
		} as unknown as BaseChatModel;

		// Create a new generator instance with the mock model
		generator = new TagGenerator(mockModel);
	});

	describe('suggestTags', () => {
		it('should generate tags successfully', async () => {
			// Given: a note content
			const noteContent =
				'This is a TypeScript code example showing web development testing practices';
			const existingTags = new Set(['#javascript']);
			const expectedTags = ['typescript', '#web-development', 'testing'];

			// When: generating tags
			const result = await generator.suggestTags(noteContent, existingTags);

			// Then: it should return the expected tags
			expect(result).toEqual(expectedTags);

			// Verify the model was called with the correct messages
			const calls = (mockModel.invoke as any).mock.calls[0][0];
			expect(calls.length).toBe(2);
			expect(calls[0]).toBeInstanceOf(SystemMessage);
			expect(calls[0].content).toContain('kebab-case');
			expect(calls[0].content).toContain('Content to analyze:\n' + noteContent);
			expect(calls[0].content).toContain('Existing tags:\njavascript');
			expect(calls[1]).toBeInstanceOf(HumanMessage);
			expect(calls[1].content).toBe('');
		});

		it('should handle empty content gracefully', async () => {
			// Given: empty content
			const emptyContent = '';
			mockModel.invoke = vi.fn().mockResolvedValue({
				content: JSON.stringify({
					tags: [],
				}),
			});

			// When: generating tags
			const result = await generator.suggestTags(emptyContent);

			// Then: it should return an empty array
			expect(result).toEqual([]);
		});

		it('should handle existing tags correctly', async () => {
			// Given: content and existing tags
			const noteContent = 'Some content about programming';
			const existingTags = new Set(['#tag1', '#tag2']);
			mockModel.invoke = vi.fn().mockResolvedValue({
				content: JSON.stringify({
					tags: ['programming', 'development'],
				}),
			});

			// When: generating tags
			const result = await generator.suggestTags(noteContent, existingTags);

			// Then: existing tags should be included in the prompt and result should be formatted
			const calls = (mockModel.invoke as any).mock.calls[0][0];
			expect(calls[0].content).toContain('Existing tags:\ntag1, tag2');
			expect(result).toEqual(['programming', 'development']);
		});

		it('should handle LLM failure gracefully', async () => {
			// Given: a failing model
			mockModel.invoke = vi.fn().mockRejectedValue(new Error('LLM processing failed'));

			// When/Then: it should throw an error
			await expect(generator.suggestTags('content')).rejects.toThrow('LLM processing failed');
		});

		it('should format tags correctly and filter invalid ones', async () => {
			// Given: a response with spaces and various formats
			mockModel.invoke = vi.fn().mockResolvedValue({
				content: JSON.stringify({
					tags: ['tag one', 'tag-two', 'tag_three', 'valid-tag'],
				}),
			});

			// When: generating tags
			const result = await generator.suggestTags('content');

			// Then: it should format tags correctly (filter out tags with spaces)
			expect(result).toEqual(['#tag-two', '#tag_three', '#valid-tag']);
		});

		it('should handle non-JSON LLM responses', async () => {
			// Given: a response in numbered list format
			mockModel.invoke = vi.fn().mockResolvedValue({
				content: '1. typescript\n2. web-dev\n3. testing',
			});

			// When: generating tags
			const result = await generator.suggestTags('content');

			// Then: it should parse and format the tags correctly
			expect(result).toEqual(['typescript', '#web-dev', 'testing']);
		});
	});
});
