import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '../../../src/services/SettingsService';
import { LLMProvider } from '../../../src/services/llmFactory';
import InsightEngine from '../../../src/core/InsightEngine';

describe('SettingsService', () => {
	let mockPlugin: InsightEngine;
	let settingsService: SettingsService;

	beforeEach(() => {
		mockPlugin = {
			settings: {
				llmProvider: LLMProvider.OPENAI,
				llmHost: '',
				modelName: '',
				apiKey: '',
				tagStyle: 'camelCase',
				tagFormat: 'property',
				tagLocation: 'top',
			},
			saveSettings: vi.fn().mockResolvedValue(undefined),
		} as unknown as InsightEngine;
		settingsService = new SettingsService(mockPlugin);

		// Reset environment variables
		delete process.env.OPENAI_API_KEY;
	});

	describe('updateSettings', () => {
		it('should update plugin settings and save', async () => {
			// Given
			const updates = {
				modelName: 'gpt-4',
				tagStyle: 'PascalCase' as const,
			};

			// When
			await settingsService.updateSettings(updates);

			// Then
			expect(mockPlugin.settings.modelName).toBe('gpt-4');
			expect(mockPlugin.settings.tagStyle).toBe('PascalCase');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});

	describe('updateLLMProvider', () => {
		it('should update provider to OLLAMA with default host', async () => {
			// When
			await settingsService.updateLLMProvider(LLMProvider.OLLAMA);

			// Then
			expect(mockPlugin.settings.llmProvider).toBe(LLMProvider.OLLAMA);
			expect(mockPlugin.settings.llmHost).toBe('http://localhost:11434');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		it('should update provider to OpenAI with default model', async () => {
			// Given
			mockPlugin.settings.llmProvider = LLMProvider.OLLAMA;

			// When
			await settingsService.updateLLMProvider(LLMProvider.OPENAI);

			// Then
			expect(mockPlugin.settings.llmProvider).toBe(LLMProvider.OPENAI);
			expect(mockPlugin.settings.modelName).toBe('gpt-4');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});

	describe('updateAPIKey', () => {
		it('should update API key and set environment variable', async () => {
			// When
			await settingsService.updateAPIKey('test-api-key');

			// Then
			expect(mockPlugin.settings.apiKey).toBe('test-api-key');
			expect(process.env.OPENAI_API_KEY).toBe('test-api-key');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});

		it('should remove API key and environment variable when empty', async () => {
			// Given
			process.env.OPENAI_API_KEY = 'existing-key';
			mockPlugin.settings.apiKey = 'existing-key';

			// When
			await settingsService.updateAPIKey('');

			// Then
			expect(mockPlugin.settings.apiKey).toBe('');
			expect(process.env.OPENAI_API_KEY).toBeUndefined();
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});
});
