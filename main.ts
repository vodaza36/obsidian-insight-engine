import { App, Plugin, PluginSettingTab, Setting, TFile, MarkdownView, Modal, Notice } from 'obsidian';
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

		// Add command to generate tags for current note
		this.addCommand({
			id: 'generate-note-tags',
			name: 'Generate Tags for Current Note',
			editorCallback: async (editor, view) => {
				if (view.file) {
					await this.generateTagsForNote(view.file);
				}
			}
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

	private async generateTagsForNote(file: TFile) {
		const content = await this.app.vault.read(file);
		const suggestedTags = await this.suggestTags(file, content);
		
		if (suggestedTags && suggestedTags.length > 0) {
			const modal = new TagSuggestionModal(this.app, suggestedTags, async (selectedTags) => {
				if (selectedTags.length > 0) {
					await this.appendTagsToNote(file, selectedTags);
				}
			});
			modal.open();
		} else {
			// Show error if no tags were generated
			new Notice('No tags could be generated for this note.');
		}
	}

	private async suggestTags(file: TFile, content: string): Promise<string[]> {
		// Create a prompt template for tag suggestion
		const promptTemplate = new PromptTemplate({
			template: `You are a tag suggestion system. Analyze the following content and suggest relevant tags for organizing it.
			Focus on the main topics, concepts, and categories that would help in finding this content later.

Content to analyze:
{text}

Rules for tag suggestions:
1. Provide exactly 5-7 relevant tags
2. Use lowercase words only
3. For multi-word tags, use dashes (e.g., 'artificial-intelligence')
4. Focus on content-specific tags, avoid generic tags
5. Tags should be specific enough to be useful but general enough to be reusable

Provide your response as a comma-separated list of tags (without the # symbol).

Suggested tags:`,
			inputVariables: ['text']
		});

		try {
			const prompt = await promptTemplate.format({ text: content });
			const response = await this.model.call(prompt);
			
			// Process the response into a clean array of tags
			return response
				.split(',')
				.map(tag => tag.trim().toLowerCase())
				.filter(tag => tag.length > 0);
		} catch (error) {
			console.error('Error generating tags:', error);
			return [];
		}
	}

	private async appendTagsToNote(file: TFile, tags: string[]) {
		try {
			const content = await this.app.vault.read(file);
			const formattedTags = tags.map(tag => `#${tag}`).join(' ');
			
			// If the file already has a YAML frontmatter, we'll add tags there
			const hasYamlFrontmatter = content.startsWith('---\n');
			
			let newContent: string;
			if (hasYamlFrontmatter) {
				const endOfFrontmatter = content.indexOf('---\n', 4);
				if (endOfFrontmatter !== -1) {
					const frontmatter = content.substring(0, endOfFrontmatter);
					const restOfContent = content.substring(endOfFrontmatter);
					
					if (frontmatter.includes('tags:')) {
						// Append to existing tags
						newContent = frontmatter.replace(
							/tags:.*?\n/,
							(match) => match.trim() + ' ' + formattedTags + '\n'
						) + restOfContent;
					} else {
						// Add new tags field
						newContent = frontmatter + `tags: ${formattedTags}\n` + restOfContent;
					}
				} else {
					newContent = content + `\n\n${formattedTags}`;
				}
			} else {
				// Append tags at the end of the file
				newContent = content + `\n\n${formattedTags}`;
			}
			
			await this.app.vault.modify(file, newContent);
			new Notice(`Added ${tags.length} tags to the note`);
		} catch (error) {
			console.error('Error appending tags:', error);
			new Notice('Failed to add tags to the note');
		}
	}

	async analyzeAllNotes() {
		const files = this.app.vault.getMarkdownFiles();
		
		for (const file of files) {
			const content = await this.app.vault.read(file);
			await this.suggestTags(file, content);
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

class TagSuggestionModal extends Modal {
	private suggestedTags: string[];
	private callback: (selectedTags: string[]) => void;

	constructor(app: App, suggestedTags: string[], callback: (selectedTags: string[]) => void) {
		super(app);
		this.suggestedTags = suggestedTags;
		this.callback = callback;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Tag Suggestions'});
		const tagList = contentEl.createDiv();
		const selectedTags: string[] = [];

		this.suggestedTags.forEach(tag => {
			const tagEl = tagList.createDiv();
			tagEl.setText(tag);
			tagEl.addClass('tag-suggestion');
			tagEl.onClickEvent(() => {
				if (selectedTags.includes(tag)) {
					selectedTags.splice(selectedTags.indexOf(tag), 1);
					tagEl.removeClass('selected');
				} else {
					selectedTags.push(tag);
					tagEl.addClass('selected');
				}
			});
		});

		const buttonContainer = contentEl.createDiv();
		const applyButton = buttonContainer.createEl('button', {text: 'Apply Tags'});
		applyButton.addClass('button');
		applyButton.onclick = () => {
			this.callback(selectedTags);
			this.close();
		};
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
