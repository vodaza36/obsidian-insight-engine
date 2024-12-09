import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseLLMService, LLMResponse } from '../../../../src/services/base/BaseLLMService';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';

// Create a concrete implementation of the abstract class for testing
class TestLLMService extends BaseLLMService<string> {
	public async testProcessWithLLM(
		content: string,
		systemPrompt: string,
		parseResponse: (response: string) => string
	): Promise<LLMResponse<string>> {
		return this.processWithLLM(content, systemPrompt, parseResponse);
	}

	public async testProcessWithTemplate(
		content: string,
		promptTemplate: PromptTemplate,
		parseResponse: (response: string) => string
	): Promise<LLMResponse<string>> {
		return this.processWithTemplate(content, promptTemplate, parseResponse);
	}
}

describe('BaseLLMService', () => {
	let mockModel: BaseChatModel;
	let service: TestLLMService;

	beforeEach(() => {
		// Create a mock LLM model
		mockModel = {
			invoke: vi.fn(),
		} as unknown as BaseChatModel;

		service = new TestLLMService(mockModel);
	});

	describe('processWithLLM', () => {
		it('should successfully process content and return result', async () => {
			const mockResponse = new AIMessage('processed content');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			const result = await service.testProcessWithLLM(
				'test content',
				'system prompt',
				(response) => response
			);

			expect(mockModel.invoke).toHaveBeenCalledWith([
				new SystemMessage('system prompt'),
				new HumanMessage('test content'),
			]);
			expect(result.result).toBe('processed content');
			expect(result.error).toBeUndefined();
		});

		it('should handle concurrent processing requests', async () => {
			const mockResponse = new AIMessage('processed content');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			// Start first request
			const firstRequest = service.testProcessWithLLM(
				'test content 1',
				'system prompt',
				(response) => response
			);

			// Try to start second request immediately
			const secondRequest = service.testProcessWithLLM(
				'test content 2',
				'system prompt',
				(response) => response
			);

			const [first, second] = await Promise.all([firstRequest, secondRequest]);

			expect(first.error).toBeUndefined();
			expect(second.error).toBe('Another request is currently being processed');
		});

		it('should handle connection errors appropriately', async () => {
			(mockModel.invoke as any).mockRejectedValue(new Error('ECONNREFUSED'));

			const result = await service.testProcessWithLLM(
				'test content',
				'system prompt',
				(response) => response
			);

			expect(result.error).toBe(
				'Unable to connect to Ollama server. Please make sure it is running and accessible.'
			);
			expect(result.result).toBeNull();
		});

		it('should handle failed fetch errors appropriately', async () => {
			(mockModel.invoke as any).mockRejectedValue(new Error('Failed to fetch'));

			const result = await service.testProcessWithLLM(
				'test content',
				'system prompt',
				(response) => response
			);

			expect(result.error).toBe(
				'Unable to connect to Ollama server. Please make sure it is running and accessible.'
			);
			expect(result.result).toBeNull();
		});

		it('should handle parse response errors', async () => {
			const mockResponse = new AIMessage('invalid json');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			const result = await service.testProcessWithLLM(
				'test content',
				'system prompt',
				(response) => {
					throw new Error('Parse error');
				}
			);

			expect(result.error).toBe('Failed to process content: Parse error');
			expect(result.result).toBeNull();
		});

		it('should properly clean up isProcessing flag after error', async () => {
			(mockModel.invoke as any).mockRejectedValue(new Error('Test error'));

			await service.testProcessWithLLM(
				'test content',
				'system prompt',
				(response) => response
			);

			// Should be able to process next request
			const mockResponse = new AIMessage('processed content');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			const result = await service.testProcessWithLLM(
				'test content 2',
				'system prompt',
				(response) => response
			);

			expect(result.error).toBeUndefined();
			expect(result.result).toBe('processed content');
		});
	});

	describe('processWithTemplate', () => {
		it('should successfully process content with template', async () => {
			const mockResponse = new AIMessage('processed template content');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			const template = new PromptTemplate({
				template: 'Process this: {text}',
				inputVariables: ['text'],
			});

			const result = await service.testProcessWithTemplate(
				'test content',
				template,
				(response) => response
			);

			expect(mockModel.invoke).toHaveBeenCalled();
			expect(result.result).toBe('processed template content');
			expect(result.error).toBeUndefined();
		});

		it('should handle errors during template processing', async () => {
			(mockModel.invoke as any).mockRejectedValue(new Error('Template processing failed'));

			const template = new PromptTemplate({
				template: 'Process this: {text}',
				inputVariables: ['text'],
			});

			const result = await service.testProcessWithTemplate(
				'test content',
				template,
				(response) => response
			);

			expect(result.error).toBe('Failed to process content: Template processing failed');
			expect(result.result).toBeNull();
		});

		it('should handle template format errors', async () => {
			const template = new PromptTemplate({
				template: 'Process this: {text}',
				inputVariables: ['text'],
			});

			// Mock format to throw an error
			vi.spyOn(template, 'format').mockRejectedValue(new Error('Template format error'));

			const result = await service.testProcessWithTemplate(
				'test content',
				template,
				(response) => response
			);

			expect(result.error).toBe('Failed to process content: Template format error');
			expect(result.result).toBeNull();
		});

		it('should handle parse errors in template processing', async () => {
			const mockResponse = new AIMessage('invalid format');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			const template = new PromptTemplate({
				template: 'Process this: {text}',
				inputVariables: ['text'],
			});

			const result = await service.testProcessWithTemplate(
				'test content',
				template,
				(response) => {
					throw new Error('Parse error');
				}
			);

			expect(result.error).toBe('Failed to process content: Parse error');
			expect(result.result).toBeNull();
		});

		it('should properly clean up isProcessing flag after template error', async () => {
			const template = new PromptTemplate({
				template: 'Process this: {text}',
				inputVariables: ['text'],
			});

			(mockModel.invoke as any).mockRejectedValue(new Error('Test error'));

			await service.testProcessWithTemplate('test content', template, (response) => response);

			// Should be able to process next request
			const mockResponse = new AIMessage('processed content');
			(mockModel.invoke as any).mockResolvedValue(mockResponse);

			const result = await service.testProcessWithTemplate(
				'test content 2',
				template,
				(response) => response
			);

			expect(result.error).toBeUndefined();
			expect(result.result).toBe('processed content');
		});
	});
});
