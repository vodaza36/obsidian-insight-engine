import { Plugin, TFile, Notice, getAllTags, Modal as ObsidianModal, Setting } from 'obsidian';
import { TagAgentSettings, DEFAULT_SETTINGS } from '../models/types';
import { TagGenerator } from '../services/tagGenerator';
import { TagSuggestionModal } from '../ui/TagSuggestionModal';
import { TagAgentSettingTab } from '../ui/SettingsTab';
import { LoadingModal } from '../ui/LoadingModal';
import { LLMFactory } from '../services/llmFactory';

// Add this type definition near the top of the file, after other imports
type TagSuggestion = {
    name: string;
    isExisting: boolean;
};

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

		// Add settings tab first, before trying to initialize the generator
		this.addSettingTab(new TagAgentSettingTab(this.app, this));
		
		// Try to initialize the tag generator
		this.initializeTagGenerator();

		// Add command to generate tags for current note
		this.addCommand({
			id: 'generate-note-tags',
			name: 'Generate Tags for Current Note',
			editorCallback: async (editor, view) => {
				if (!this.tagGenerator) {
					new Notice('Please configure the Tag Agent settings first.');
					return;
				}
				if (view.file) {
					await this.generateTagsForNote(view.file);
				}
			},
		});
	}

	private initializeTagGenerator() {
		// check if the required settings are configured
		const configError = LLMFactory.validateConfig(this.settings.llmProvider, this.settings);
		if (configError) {
			new Notice(configError);
			return;
		}
		try {
			const model = LLMFactory.createModel(
				this.settings.llmProvider,
				this.settings.modelName,
				{
					llmHost: this.settings.llmHost,
					temperature: 0,
					maxRetries: 2,
					apiKey: this.settings.apiKey
				}
			);
			this.tagGenerator = new TagGenerator(model);
		} catch (error) {
			// If initialization fails, we'll show a notice but not prevent the plugin from loading
			console.warn('Failed to initialize tag generator:', error);
			new Notice('Tag generation is disabled until configuration is complete. Please check settings.');
		}
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
					const tagText = tag.tag;
					// Only remove the '#' if it exists at the start
					const cleanedTag = tagText.startsWith('#') ? tagText.substring(1) : tagText;
					tags.add(cleanedTag.toLowerCase());
				});
			}
		});

		return tags;
	}

	private async generateTagsForNote(file: TFile) {
		const content = await this.app.vault.read(file);
		const existingTags = this.getAllVaultTags();
		const fileCache = this.app.metadataCache.getFileCache(file);
		const existingNoteTags = new Set(
			(fileCache && getAllTags(fileCache) || [])
				.map(tag => tag.replace('#', '').toLowerCase())
		);
		
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
				content,
				existingTags
			);

			// Close loading modal
			loadingModal.close();

			if (suggestedTags && suggestedTags.length > 0) {
				const tagSuggestions: TagSuggestion[] = suggestedTags.map(tag => ({
					name: tag,
					isExisting: existingTags.has(tag.replace('#', ''))
				}));

				console.log('Existing tags:', existingTags);
				console.log('Tag suggestions:', tagSuggestions);

				// Show the tag suggestion modal first
				const modal = new TagSuggestionModal(
					this.app,
					tagSuggestions,
					existingNoteTags,
					async (selectedTags: string[], tagsToRemove: string[]) => {
						if (selectedTags.length > 0 || tagsToRemove.length > 0) {
							await this.appendTagsToNote(file, selectedTags, tagsToRemove);
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

	private getExistingTags(content: string, format: 'property' | 'line'): string[] {
		if (format === 'property') {
			const match = content.match(/---\n([\s\S]*?)\n---/);
			if (match) {
				const frontmatter = match[1];
				const tagMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
				if (tagMatch) {
					return tagMatch[1].split(',').map(tag => '#' + tag.trim()).filter(Boolean);
				}
			}
		} else {
			const lines = content.split('\n');
			const h1Index = lines.findIndex(line => line.startsWith('# '));
			
			if (h1Index !== -1) {
				// Check if there's already a tag line after H1
				if (h1Index + 1 < lines.length && lines[h1Index + 1].includes('#')) {
					return lines[h1Index + 1].trim().split(/\s+/).filter(Boolean);
				}
			} else {
				// If no H1 found, check if there's already a tag line at the start
				if (lines[0] && lines[0].includes('#')) {
					return lines[0].trim().split(/\s+/).filter(Boolean);
				}
			}
		}
		return [];
	}

	private formatTagsForProperty(tags: string[]): string {
		// Remove '#' prefix for YAML format and join with commas
		return tags.map(tag => tag.replace(/^#/, '')).join(', ');
	}

	private async appendTagsToNote(file: TFile, tags: string[], tagsToRemove: string[] = []) {
		const content = await this.app.vault.read(file);
		let newContent = content;
		const existingTags = this.getExistingTags(content, this.settings.tagFormat);
		
		// Remove tags that should be removed and format new tags
		const formattedNewTags = tags
			.filter(tag => !tagsToRemove.includes(tag))
			.map(tag => (tag.startsWith('#') ? tag : `#${tag}`));

		if (this.settings.tagFormat === 'property') {
			// Handle frontmatter property format
			const yamlSeparator = '---\n';
			const hasYamlHeader = content.startsWith(yamlSeparator);
			const endOfYamlIndex = hasYamlHeader ? content.indexOf(yamlSeparator, yamlSeparator.length) : -1;

			if (hasYamlHeader && endOfYamlIndex !== -1) {
				const yamlContent = content.slice(yamlSeparator.length, endOfYamlIndex);
				const restContent = content.slice(endOfYamlIndex + yamlSeparator.length);
				const yamlLines = yamlContent.split('\n');

				// Remove existing tags property
				const tagLineIndex = yamlLines.findIndex(line => line.startsWith('tags:'));
				if (tagLineIndex !== -1) {
					yamlLines.splice(tagLineIndex, 1);
				}

				// Add new tags
				if (formattedNewTags.length > 0) {
					yamlLines.push(`tags: [${formattedNewTags.map(tag => tag.replace('#', '')).join(', ')}]`);
				}

				newContent = `${yamlSeparator}${yamlLines.join('\n')}\n${yamlSeparator}${restContent}`;
			} else if (formattedNewTags.length > 0) {
				// Create new YAML header if none exists
				newContent = `${yamlSeparator}tags: [${formattedNewTags.map(tag => tag.replace('#', '')).join(', ')}]\n${yamlSeparator}\n${content}`;
			}
		} else {
			// Handle inline tags format
			const lines = content.split('\n');
			const formattedTags = formattedNewTags.join(' ');

			// Remove existing inline tags
			const tagLinePattern = /^#[^\n]+$/;
			const cleanedLines = lines.filter(line => !tagLinePattern.test(line.trim()));

			// If no tags to add, just return the cleaned content
			if (formattedNewTags.length === 0) {
				newContent = cleanedLines.join('\n');
			} else {
				// Add tags based on location setting
				switch (this.settings.tagLocation || 'top') {
					case 'top':
						cleanedLines.unshift(formattedTags);
						break;

					case 'below-title':
						const h1Index = cleanedLines.findIndex(line => line.startsWith('# '));
						if (h1Index !== -1) {
							cleanedLines.splice(h1Index + 1, 0, '', formattedTags);
						} else {
							// If no title found, add to top
							cleanedLines.unshift(formattedTags);
						}
						break;

					case 'bottom':
						if (cleanedLines[cleanedLines.length - 1] !== '') {
							cleanedLines.push('');
						}
						cleanedLines.push(formattedTags);
						break;
				}
				newContent = cleanedLines.join('\n');
			}
		}

		// Only modify the file if changes were made
		if (newContent !== content) {
			await this.app.vault.modify(file, newContent);
			
			// Prepare notification message
			const addedTags = formattedNewTags.filter(tag => !existingTags.includes(tag));
			const removedTags = tagsToRemove.filter(tag => 
				existingTags.some(existingTag => 
					existingTag.toLowerCase() === (tag.startsWith('#') ? tag : `#${tag}`).toLowerCase()
				)
			);
			
			let message = '';
			if (addedTags.length > 0) {
				message += `Added tags: ${addedTags.join(' ')}`;
			}
			if (removedTags.length > 0) {
				if (message) message += '\n';
				message += `Removed tags: ${removedTags.join(' ')}`;
			}
			if (message) {
				new Notice(message);
			}
		}
	}
}
