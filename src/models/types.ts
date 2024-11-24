import { TagAgentSettings } from 'obsidian';

export interface TagAgentSettings {
	ollamaHost: string;
	ollamaModel: string;
}

export const DEFAULT_SETTINGS: TagAgentSettings = {
	ollamaHost: 'http://localhost:11434',
	ollamaModel: 'mistral',
};
