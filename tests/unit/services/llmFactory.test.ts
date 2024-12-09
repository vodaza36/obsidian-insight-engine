import { describe, it, expect, vi } from 'vitest';
import { LLMFactory, LLMProvider } from '../../../src/services/llmFactory';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';

describe('LLMFactory', () => {
	describe('validateConfig', () => {
		describe('when validating OpenAI configuration', () => {
			it('should return null for valid configuration', () => {
				// Given: a valid OpenAI configuration
				const settings = { apiKey: 'test-api-key' };

				// When: validating the configuration
				const result = LLMFactory.validateConfig(LLMProvider.OPENAI, settings);

				// Then: it should return null indicating valid config
				expect(result).toBeNull();
			});

			it('should return error message when API key is missing', () => {
				// Given: an invalid OpenAI configuration without API key
				const settings = {};

				// When: validating the configuration
				const result = LLMFactory.validateConfig(LLMProvider.OPENAI, settings);

				// Then: it should return an error message
				expect(result).toBe(
					'OpenAI API key is required. Please configure it in the settings.'
				);
			});
		});

		describe('when validating Ollama configuration', () => {
			it('should return null for valid configuration', () => {
				// Given: a valid Ollama configuration
				const settings = { llmHost: 'http://localhost:11434' };

				// When: validating the configuration
				const result = LLMFactory.validateConfig(LLMProvider.OLLAMA, settings);

				// Then: it should return null indicating valid config
				expect(result).toBeNull();
			});

			it('should return error message when host URL is missing', () => {
				// Given: an invalid Ollama configuration without host URL
				const settings = {};

				// When: validating the configuration
				const result = LLMFactory.validateConfig(LLMProvider.OLLAMA, settings);

				// Then: it should return an error message
				expect(result).toBe(
					'Ollama host URL is required. Please configure it in the settings.'
				);
			});
		});
	});

	describe('createModel', () => {
		describe('when creating an OpenAI model', () => {
			it('should create a ChatOpenAI instance with correct configuration', () => {
				// Given: valid OpenAI configuration
				const modelName = 'gpt-3.5-turbo';
				const options = { apiKey: 'test-api-key' };

				// When: creating the model
				const model = LLMFactory.createModel(LLMProvider.OPENAI, modelName, options);

				// Then: it should return a properly configured ChatOpenAI instance
				expect(model).toBeInstanceOf(ChatOpenAI);
			});

			it('should throw error when configuration is invalid', () => {
				// Given: invalid OpenAI configuration
				const modelName = 'gpt-3.5-turbo';
				const options = {};

				// When/Then: creating the model should throw an error
				expect(() =>
					LLMFactory.createModel(LLMProvider.OPENAI, modelName, options)
				).toThrow('OpenAI API key is required. Please configure it in the settings.');
			});
		});

		describe('when creating an Ollama model', () => {
			it('should create a ChatOllama instance with correct configuration', () => {
				// Given: valid Ollama configuration
				const modelName = 'llama2';
				const options = { llmHost: 'http://localhost:11434' };

				// When: creating the model
				const model = LLMFactory.createModel(LLMProvider.OLLAMA, modelName, options);

				// Then: it should return a properly configured ChatOllama instance
				expect(model).toBeInstanceOf(ChatOllama);
			});

			it('should throw error when configuration is invalid', () => {
				// Given: invalid Ollama configuration
				const modelName = 'llama2';
				const options = {};

				// When/Then: creating the model should throw an error
				expect(() =>
					LLMFactory.createModel(LLMProvider.OLLAMA, modelName, options)
				).toThrow('Ollama host URL is required. Please configure it in the settings.');
			});
		});

		it('should throw error for unsupported provider', () => {
			// Given: an unsupported provider
			const modelName = 'test-model';
			const options = {};
			const invalidProvider = 'invalid' as LLMProvider;

			// When/Then: creating the model should throw an error
			expect(() => LLMFactory.createModel(invalidProvider, modelName, options)).toThrow(
				`Unsupported LLM provider: ${invalidProvider}`
			);
		});
	});
});
