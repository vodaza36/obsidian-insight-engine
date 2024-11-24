import { App, PluginSettingTab, Setting } from 'obsidian';
import TagAgent from '../core/TagAgent';

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
			.setName('Ollama Host')
			.setDesc('The host address of your Ollama instance')
			.addText((text) =>
				text
					.setPlaceholder('http://localhost:11434')
					.setValue(this.plugin.settings.ollamaHost)
					.onChange(async (value) => {
						this.plugin.settings.ollamaHost = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Ollama Model')
			.setDesc('The model to use for tag generation')
			.addText((text) =>
				text
					.setPlaceholder('mistral')
					.setValue(this.plugin.settings.ollamaModel)
					.onChange(async (value) => {
						this.plugin.settings.ollamaModel = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
