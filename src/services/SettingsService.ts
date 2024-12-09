import { LLMProvider } from './llmFactory';
import InsightEngine from '../core/InsightEngine';

export class SettingsService {
	constructor(private plugin: InsightEngine) {}

	async updateSettings(updates: Partial<typeof this.plugin.settings>) {
		Object.assign(this.plugin.settings, updates);
		await this.plugin.saveSettings();
	}

	async updateLLMProvider(provider: LLMProvider) {
		const updates: Partial<typeof this.plugin.settings> = {
			llmProvider: provider,
		};

		if (provider === LLMProvider.OLLAMA) {
			updates.llmHost = 'http://localhost:11434';
		}
		if (provider === LLMProvider.OPENAI) {
			updates.modelName = 'gpt-4';
		}

		await this.updateSettings(updates);
	}

	async updateAPIKey(apiKey: string) {
		if (apiKey) {
			process.env.OPENAI_API_KEY = apiKey;
		} else {
			delete process.env.OPENAI_API_KEY;
		}
		await this.updateSettings({ apiKey });
	}
}
