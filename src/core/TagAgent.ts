import { Plugin, TFile, Notice, getAllTags } from 'obsidian';
import { TagAgentSettings, DEFAULT_SETTINGS } from '../models/types';
import { TagGenerator } from '../services/tagGenerator';
import { TagSuggestionModal } from '../ui/TagSuggestionModal';
import { TagAgentSettingTab } from '../ui/SettingsTab';
import { LoadingModal } from '../ui/LoadingModal';

/**
 * This class is the entrypoint for the TagAgent plugin.
 * It provides the UI integration points for the plugin such as the settings tab and the command for analyzing the current note.
 * It also provides the core functionality for generating tags for a note.
 */
export default class TagAgent extends Plugin {
	settings: TagAgentSettings;
	tagGenerator: TagGenerator;
	existingTags: Set<string> = new Set();

	async onload() {
		await this.loadSettings();
		this.initializeTagGenerator();

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
			},
		});

		// Add command to analyze all notes
		this.addCommand({
			id: 'analyze-all-notes',
			name: 'Analyze All Notes',
			callback: () => this.analyzeAllNotes(),
		});
	}

	private initializeTagGenerator() {
		this.tagGenerator = new TagGenerator(this.settings.ollamaHost, this.settings.ollamaModel);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.initializeTagGenerator();
	}

	private getAllVaultTags(): Set<string> {
		const tags = new Set<string>();
		const files = this.app.vault.getMarkdownFiles();

		files.forEach(file => {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);
			if (cachedMetadata?.tags) {
				cachedMetadata.tags.forEach(tag => {
					// Remove the '#' prefix and convert to lowercase
					tags.add(tag.tag.substring(1).toLowerCase());
				});
			}
		});

		return tags;
	}

	private async generateTagsForNote(file: TFile) {
		const content = await this.app.vault.read(file);
		const existingTags = this.getAllVaultTags();
		
		// Show loading modal
		const loadingModal = new LoadingModal(
			this.app,
			'Generating tags...',
			() => {
				new Notice('Tag generation cancelled');
			}
		);
		loadingModal.open();

		try {
			const suggestedTags = await this.tagGenerator.suggestTags(
				file,
				content,
				existingTags,
				loadingModal.getAbortSignal()
			);

			// Close loading modal
			loadingModal.close();

			if (suggestedTags && suggestedTags.length > 0) {
				const modal = new TagSuggestionModal(
					this.app,
					suggestedTags,
					(selectedTags) => {
						if (selectedTags.length > 0) {
							this.appendTagsToNote(file, selectedTags);
						}
					}
				);
				modal.open();
			} else {
				new Notice('No tags were suggested for this note.');
			}
		} catch (error) {
			loadingModal.close();
			
			if (error.message.includes('Ollama server is not running')) {
				new Notice('Error: Ollama server is not running. Please start it using the command: "ollama serve"', 10000);
			} else if (error.name === 'AbortError') {
				// Already handled by the loading modal callback
			} else {
				new Notice(`Error generating tags: ${error.message}`);
			}
		}
	}

	private async appendTagsToNote(file: TFile, tags: string[]) {
		const content = await this.app.vault.read(file);
		const formattedTags = tags.map((tag) => `#${tag}`).join(' ');

		// Check if the file already has a YAML frontmatter
		const hasYamlFrontmatter = content.startsWith('---\n');

		let newContent: string;
		if (hasYamlFrontmatter) {
			const [frontmatter, ...rest] = content.split('---\n');
			newContent = `${frontmatter}tags: ${formattedTags}\n---\n${rest.join('---\n')}`;
		} else {
			newContent = `---\ntags: ${formattedTags}\n---\n\n${content}`;
		}

		await this.app.vault.modify(file, newContent);
		new Notice(`Added tags: ${formattedTags}`);
	}

	async analyzeAllNotes() {
		const files = this.app.vault.getMarkdownFiles();
		let processedCount = 0;

		for (const file of files) {
			await this.generateTagsForNote(file);
			processedCount++;
			new Notice(`Processed ${processedCount}/${files.length} notes`);
		}
	}
}
