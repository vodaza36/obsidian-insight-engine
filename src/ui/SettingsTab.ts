import { App, PluginSettingTab, Setting, DropdownComponent } from 'obsidian';
import TagAgent from '../core/TagAgent';
import { LLMProvider } from '../services/llmFactory';

export class TagAgentSettingTab extends PluginSettingTab {
	plugin: TagAgent;

	constructor(app: App, plugin: TagAgent) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Tag Agent Settings' });

		new Setting(containerEl)
			.setName('LLM Provider')
			.setDesc('Choose your LLM provider')
			.addDropdown((dropdown: DropdownComponent) => {
				Object.values(LLMProvider).forEach((provider) => {
					dropdown.addOption(provider, provider);
				});
				dropdown
					.setValue(this.plugin.settings.llmProvider)
					.onChange(async (value) => {
						this.plugin.settings.llmProvider = value as LLMProvider;
						if (value === LLMProvider.OLLAMA && !this.plugin.settings.llmHost) {
							this.plugin.settings.llmHost = 'http://localhost:11434';
						}
						if (value === LLMProvider.OPENAI) {
							this.plugin.settings.modelName = 'gpt-4';
						}
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings UI
					});
			});

		new Setting(containerEl)
			.setName('Model Name')
			.setDesc('The name of the LLM model to use')
			.addText((text) =>
				text
					.setPlaceholder('gpt-3.5-turbo')
					.setValue(this.plugin.settings.modelName)
					.onChange(async (value) => {
						this.plugin.settings.modelName = value;
						await this.plugin.saveSettings();
					})
			);

		if (this.plugin.settings.llmProvider === LLMProvider.OLLAMA) {
			new Setting(containerEl)
				.setName('LLM Host')
				.setDesc('The host address of your LLM server')
				.addText((text) =>
					text
						.setPlaceholder('http://localhost:11434')
						.setValue(this.plugin.settings.llmHost || '')
						.onChange(async (value) => {
							this.plugin.settings.llmHost = value;
							await this.plugin.saveSettings();
						})
				);
		}

		if (this.plugin.settings.llmProvider === LLMProvider.OPENAI) {
			new Setting(containerEl)
				.setName('OpenAI API Key')
				.setDesc('Your OpenAI API key')
				.addText((text) =>
					text
						.setPlaceholder('sk-...')
						.setValue(this.plugin.settings.apiKey || '')
						.onChange(async (value) => {
							this.plugin.settings.apiKey = value;
							// Set environment variable
							if (value) {
								process.env.OPENAI_API_KEY = value;
							} else {
								delete process.env.OPENAI_API_KEY;
							}
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(containerEl)
			.setName('Tag Format')
			.setDesc('Choose how tags should be formatted in your notes')
			.addDropdown((dropdown: DropdownComponent) => {
				dropdown
					.addOption('property', 'Frontmatter')
					.addOption('line', 'Inline Tags')
					.setValue(this.plugin.settings.tagFormat)
					.onChange(async (value) => {
						this.plugin.settings.tagFormat = value as 'property' | 'line';
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings UI to show/hide tag location
					});
			});

		// Only show tag location setting if tag format is 'line'
		if (this.plugin.settings.tagFormat === 'line') {
			new Setting(containerEl)
				.setName('Tag Location')
				.setDesc('Choose where to place the generated tags')
				.addDropdown((dropdown: DropdownComponent) => {
					dropdown
						.addOption('top', 'Top')
						.addOption('below-title', 'Below Page Title')
						.addOption('bottom', 'Bottom')
						.setValue(this.plugin.settings.tagLocation || 'top')
						.onChange(async (value) => {
							this.plugin.settings.tagLocation = value as 'top' | 'below-title' | 'bottom';
							await this.plugin.saveSettings();
						});
				});
		}
	}
}
