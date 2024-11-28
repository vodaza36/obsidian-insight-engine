import { LLMProvider } from '../services/llmFactory';

export interface TagAgentSettings {
	llmProvider: LLMProvider;
	modelName: string;
	llmHost?: string;
	apiKey?: string;
	tagFormat: 'property' | 'line';
	tagLocation: 'top' | 'below-title' | 'bottom';
	tagStyle: 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'Train-Case' | 'UPPERCASE' | 'lowercase';
}

export const DEFAULT_SETTINGS: TagAgentSettings = {
	llmProvider: LLMProvider.OLLAMA,
	modelName: 'llama2',
	tagFormat: 'property',
	llmHost: 'http://localhost:11434',
	tagLocation: 'top',
	tagStyle: 'kebab-case',
};

export interface TagSuggestion {
    tag: string;
    confidence: number;
}
