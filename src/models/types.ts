export interface TagAgentSettings {
	ollamaHost: string;
	ollamaModel: string;
}

export const DEFAULT_SETTINGS: TagAgentSettings = {
	ollamaHost: 'http://localhost:11434',
	ollamaModel: 'llama3.1',
};

export interface TagSuggestion {
    tag: string;
    confidence: number;
}
