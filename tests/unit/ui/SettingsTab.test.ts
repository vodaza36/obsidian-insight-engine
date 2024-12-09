import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App, Setting } from 'obsidian';
import { InsightEngineSettingTab } from '../../../src/ui/SettingsTab';
import InsightEngine from '../../../src/core/InsightEngine';
import { LLMProvider } from '../../../src/services/llmFactory';

// Track callbacks for testing
const mockCallbacks = {
	dropdownOnChange: null as ((value: string) => Promise<void>) | null,
};

// Simple mock for the Setting class
vi.mock('obsidian', () => ({
	App: vi.fn(),
	PluginSettingTab: class {
		containerEl = {
			empty: vi.fn(),
			createEl: vi.fn(),
		};
	},
	Setting: class {
		constructor(containerEl: any) {
			this.containerEl = containerEl;
		}
		containerEl: any;
		setName = vi.fn().mockReturnThis();
		setDesc = vi.fn().mockReturnThis();
		addDropdown = vi.fn().mockImplementation((cb) => {
			const dropdown = {
				addOption: vi.fn().mockReturnThis(),
				setValue: vi.fn().mockReturnThis(),
				onChange: vi.fn().mockImplementation((callback) => {
					mockCallbacks.dropdownOnChange = callback;
					return dropdown;
				}),
			};
			cb(dropdown);
			return this;
		});
		addText = vi.fn().mockReturnThis();
	},
}));

describe('InsightEngineSettingTab', () => {
	let mockApp: App;
	let mockPlugin: InsightEngine;
	let settingsTab: InsightEngineSettingTab;

	beforeEach(() => {
		mockApp = new App();
		mockPlugin = {
			settings: {
				llmProvider: LLMProvider.OPENAI,
				llmHost: '',
				modelName: '',
				apiKey: '',
			},
			saveSettings: vi.fn().mockResolvedValue(undefined),
		} as unknown as InsightEngine;
		settingsTab = new InsightEngineSettingTab(mockApp, mockPlugin);
		mockCallbacks.dropdownOnChange = null;
	});

	describe('display', () => {
		it('should set up the settings UI with correct elements', () => {
			// When
			settingsTab.display();

			// Then
			expect(settingsTab.containerEl.empty).toHaveBeenCalled();
			expect(settingsTab.containerEl.createEl).toHaveBeenCalledWith('h2', {
				text: 'Insight Engine Settings',
			});
		});
	});

	describe('LLM Provider Setting', () => {
		it('should create setting with correct name and description', () => {
			// When
			const setting = settingsTab.addLLMProviderSetting();

			// Then
			expect(setting.setName).toHaveBeenCalledWith('LLM Provider');
			expect(setting.setDesc).toHaveBeenCalledWith('Choose your LLM provider');
		});

		it('should update settings when provider changes to OLLAMA', async () => {
			// Given
			settingsTab.addLLMProviderSetting();
			expect(mockCallbacks.dropdownOnChange).toBeDefined();

			// When
			await mockCallbacks.dropdownOnChange?.(LLMProvider.OLLAMA);

			// Then
			expect(mockPlugin.settings.llmProvider).toBe(LLMProvider.OLLAMA);
			expect(mockPlugin.settings.llmHost).toBe('http://localhost:11434');
			expect(mockPlugin.saveSettings).toHaveBeenCalled();
		});
	});

	describe('API Key Setting', () => {
		it('should only show API key setting for OpenAI provider', () => {
			// Given
			mockPlugin.settings.llmProvider = LLMProvider.OPENAI;

			// When
			const setting = settingsTab.addAPIKeySetting();

			// Then
			expect(setting).toBeDefined();
			expect(setting?.setName).toHaveBeenCalledWith('OpenAI API Key');
		});

		it('should not show API key setting for Ollama provider', () => {
			// Given
			mockPlugin.settings.llmProvider = LLMProvider.OLLAMA;

			// When
			const setting = settingsTab.addAPIKeySetting();

			// Then
			expect(setting).toBeUndefined();
		});
	});
});
