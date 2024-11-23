import { App, Plugin, PluginSettingTab, Setting, TFile, MarkdownView } from 'obsidian';
import { Ollama } from 'langchain/llms/ollama';
import { PromptTemplate } from 'langchain/prompts';

interface TagAgentSettings {
	ollamaHost: string;
	ollamaModel: string;
}

const DEFAULT_SETTINGS: TagAgentSettings = {
	ollamaHost: 'http://localhost:11434',
	ollamaModel: 'mistral'
}

export default class TagAgent extends Plugin {
	settings: TagAgentSettings;
	model: Ollama;
	existingTags: Set<string> = new Set();

	async onload() {
		await this.loadSettings();
		this.initializeLangChain();
		
		// Add settings tab
		this.addSettingTab(new TagAgentSettingTab(this.app, this));

		// Add command to scan vault for tags
		this.addCommand({
			id: 'scan-vault-tags',
			name: 'Scan Vault for Tags',
			callback: () => this.scanVaultTags()
		});

		// Add command to analyze current note
		this.addCommand({
			id: 'analyze-current-note',
			name: 'Analyze Current Note',
			callback: () => this.analyzeCurrentNote()
		});

		// Add command to analyze all notes
		this.addCommand({
			id: 'analyze-all-notes',
			name: 'Analyze All Notes',
			callback: () => this.analyzeAllNotes()
		});
	}

	private initializeLangChain() {
		this.model = new Ollama({ 
			baseUrl: this.settings.ollamaHost,
			model: this.settings.ollamaModel
		});
	}

	async scanVaultTags() {
		this.existingTags.clear();
		const files = this.app.vault.getMarkdownFiles();
		
		for (const file of files) {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (metadata && metadata.tags) {
				metadata.tags.forEach(tag => this.existingTags.add(tag.tag.slice(1)));
			}
		}

		console.log("Found tags:", Array.from(this.existingTags));
	}

	async analyzeCurrentNote() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.file) {
			return;
		}

		const content = await this.app.vault.read(activeView.file);
		await this.suggestTags(activeView.file, content);
	}

	async analyzeAllNotes() {
		const files = this.app.vault.getMarkdownFiles();
		
		for (const file of files) {
			const content = await this.app.vault.read(file);
			await this.suggestTags(file, content);
		}
	}

	private async suggestTags(file: TFile, content: string) {
		// Create a prompt template for tag suggestions using existing tags
		const promptTemplate = new PromptTemplate({
			template: `You are a tag suggestion system. Based on the existing tags and the content provided, suggest relevant tags for organizing the content.

Existing tags: {existingTags}

Content to analyze:
{text}

Provide a comma-separated list of suggested tags (without the # symbol). Only include highly relevant tags. If an existing tag is relevant, include it in your suggestions.

Suggested tags:`,
			inputVariables: ["existingTags", "text"]
		});

		try {
			const prompt = await promptTemplate.format({ 
				existingTags: Array.from(this.existingTags).join(", "),
				text: content 
			});
			const response = await this.model.call(prompt);
			
			console.log(`Suggested tags for ${file.path}:`, response);
			// TODO: Add UI for reviewing and applying suggested tags
		} catch (error) {
			console.error("Error analyzing note:", error);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.initializeLangChain();
	}
}

class TagAgentSettingTab extends PluginSettingTab {
	plugin: TagAgent;

	constructor(app: App, plugin: TagAgent) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Ollama Host')
			.setDesc('Enter your Ollama host (default: http://localhost:11434)')
			.addText(text => text
				.setPlaceholder('http://localhost:11434')
				.setValue(this.plugin.settings.ollamaHost)
				.onChange(async (value) => {
					this.plugin.settings.ollamaHost = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Ollama Model')
			.setDesc('Enter the Ollama model to use (default: mistral)')
			.addText(text => text
				.setPlaceholder('mistral')
				.setValue(this.plugin.settings.ollamaModel)
				.onChange(async (value) => {
					this.plugin.settings.ollamaModel = value;
					await this.plugin.saveSettings();
				}));
	}
}
