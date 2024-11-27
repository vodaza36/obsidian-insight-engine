import { LLMProvider } from '../services/llmFactory';

export interface TagAgentSettings {
	llmProvider: LLMProvider;
	modelName: string;
	llmHost?: string;
	apiKey?: string;
	tagFormat: 'property' | 'line';
}

export const DEFAULT_SETTINGS: TagAgentSettings = {
	llmProvider: LLMProvider.OLLAMA,
	modelName: 'llama2',
	tagFormat: 'property',
	llmHost: 'http://localhost:11434',
};

export interface TagSuggestion {
    tag: string;
    confidence: number;
}
