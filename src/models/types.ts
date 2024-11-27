import { LLMProvider } from '../services/llmFactory';

export interface TagAgentSettings {
	llmProvider: LLMProvider;
	modelName: string;
	llmHost?: string;
}

export const DEFAULT_SETTINGS: TagAgentSettings = {
	llmProvider: LLMProvider.OLLAMA,
	modelName: 'llama2',
};

export interface TagSuggestion {
    tag: string;
    confidence: number;
}
