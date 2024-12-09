/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { App, PluginSettingTab, Setting, DropdownComponent } from 'obsidian';
import InsightEngine from '../core/InsightEngine';
import { LLMProvider } from '../services/llmFactory';
import { SettingsService } from '../services/SettingsService';

export class InsightEngineSettingTab extends PluginSettingTab {
	private settingsService: SettingsService;

	constructor(
		app: App,
		private plugin: InsightEngine
	) {
		super(app, plugin);
		this.settingsService = new SettingsService(plugin);
	}

	createSetting(name: string, desc: string): Setting {
		return new Setting(this.containerEl).setName(name).setDesc(desc);
	}

	addLLMProviderSetting() {
		const setting = this.createSetting('LLM Provider', 'Choose your LLM provider');
		setting.addDropdown((dropdown: DropdownComponent) => {
			Object.values(LLMProvider).forEach((provider) => {
				dropdown.addOption(provider, provider);
			});
			dropdown.setValue(this.plugin.settings.llmProvider).onChange(async (value) => {
				await this.settingsService.updateLLMProvider(value as LLMProvider);
				this.display();
			});
		});
		return setting;
	}

	addModelNameSetting() {
		const setting = this.createSetting('Model Name', 'The name of the LLM model to use');
		setting.addText((text) =>
			text
				.setPlaceholder('gpt-3.5-turbo')
				.setValue(this.plugin.settings.modelName)
				.onChange(async (value) => {
					await this.settingsService.updateSettings({ modelName: value });
				})
		);
		return setting;
	}

	addLLMHostSetting() {
		if (this.plugin.settings.llmProvider === LLMProvider.OLLAMA) {
			const setting = this.createSetting('LLM Host', 'The host address of your LLM server');
			setting.addText((text) =>
				text
					.setPlaceholder('http://localhost:11434')
					.setValue(this.plugin.settings.llmHost || '')
					.onChange(async (value) => {
						await this.settingsService.updateSettings({ llmHost: value });
					})
			);
			return setting;
		}
	}

	addAPIKeySetting() {
		if (this.plugin.settings.llmProvider === LLMProvider.OPENAI) {
			const setting = this.createSetting('OpenAI API Key', 'Your OpenAI API key');
			setting.addText((text) =>
				text
					.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.apiKey || '')
					.onChange(async (value) => {
						await this.settingsService.updateAPIKey(value);
					})
			);
			return setting;
		}
	}

	addTagStyleSetting() {
		const setting = this.createSetting('Tag Style', 'Choose the case style for generated tags');
		setting.addDropdown((dropdown: DropdownComponent) => {
			dropdown
				.addOption('camelCase', 'camelCase (e.g., meetingNotes)')
				.addOption('PascalCase', 'PascalCase (e.g., MeetingNotes)')
				.addOption('snake_case', 'snake_case, (e.g., meeting_notes)')
				.addOption('kebab-case', 'kebab-case, (e.g., meeting-notes)')
				.addOption('Train-Case', 'Train-Case, (e.g., Meeting-Notes)')
				.addOption('UPPERCASE', 'UPPERCASE, (e.g., MEETINGNOTES)')
				.addOption('lowercase', 'lowercase, (e.g., meetingnotes)')
				.setValue(this.plugin.settings.tagStyle)
				.onChange(async (value) => {
					await this.settingsService.updateSettings({
						tagStyle: value as
							| 'camelCase'
							| 'PascalCase'
							| 'snake_case'
							| 'kebab-case'
							| 'Train-Case'
							| 'UPPERCASE'
							| 'lowercase',
					});
				});
		});
		return setting;
	}

	addTagFormatSetting() {
		const setting = this.createSetting(
			'Tag Format',
			'Choose how tags should be formatted in your notes'
		);
		setting.addDropdown((dropdown: DropdownComponent) => {
			dropdown
				.addOption('property', 'Frontmatter')
				.addOption('line', 'Inline Tags')
				.setValue(this.plugin.settings.tagFormat)
				.onChange(async (value) => {
					await this.settingsService.updateSettings({
						tagFormat: value as 'property' | 'line',
					});
					this.display();
				});
		});
		return setting;
	}

	addTagLocationSetting() {
		if (this.plugin.settings.tagFormat === 'line') {
			const setting = this.createSetting(
				'Tag Location',
				'Choose where to place the generated tags'
			);
			setting.addDropdown((dropdown: DropdownComponent) => {
				dropdown
					.addOption('top', 'Top')
					.addOption('bottom', 'Bottom')
					.setValue(this.plugin.settings.tagLocation || 'top')
					.onChange(async (value) => {
						await this.settingsService.updateSettings({
							tagLocation: value as 'top' | 'bottom',
						});
					});
			});
			return setting;
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Insight Engine Settings' });

		this.addLLMProviderSetting();
		this.addModelNameSetting();
		this.addLLMHostSetting();
		this.addAPIKeySetting();
		this.addTagStyleSetting();
		this.addTagFormatSetting();
		this.addTagLocationSetting();
	}
}
