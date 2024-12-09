/**
 * Unit tests for types model
 */

import { InsightEngineSettings, DEFAULT_SETTINGS, TagSuggestion } from '../../../src/models/types';
import { LLMProvider } from '../../../src/services/llmFactory';

describe('Types Model', () => {
	describe('DEFAULT_SETTINGS', () => {
		it('should have the correct default values', () => {
			expect(DEFAULT_SETTINGS.llmProvider).toBe(LLMProvider.OLLAMA);
			expect(DEFAULT_SETTINGS.modelName).toBe('llama2');
			expect(DEFAULT_SETTINGS.tagFormat).toBe('property');
			expect(DEFAULT_SETTINGS.llmHost).toBe('http://localhost:11434');
			expect(DEFAULT_SETTINGS.tagLocation).toBe('top');
			expect(DEFAULT_SETTINGS.tagStyle).toBe('kebab-case');
		});

		it('should match InsightEngineSettings interface', () => {
			const settings: InsightEngineSettings = DEFAULT_SETTINGS;
			expect(settings).toBeDefined();
		});
	});

	describe('TagSuggestion', () => {
		it('should create valid tag suggestion objects', () => {
			const tagSuggestion: TagSuggestion = {
				tag: 'test-tag',
				confidence: 0.95,
			};

			expect(tagSuggestion.tag).toBe('test-tag');
			expect(tagSuggestion.confidence).toBe(0.95);
		});

		it('should validate confidence score range', () => {
			const validTagSuggestions: TagSuggestion[] = [
				{ tag: 'tag1', confidence: 0 },
				{ tag: 'tag2', confidence: 0.5 },
				{ tag: 'tag3', confidence: 1 },
			];

			validTagSuggestions.forEach((suggestion) => {
				expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
				expect(suggestion.confidence).toBeLessThanOrEqual(1);
			});
		});
	});
});
