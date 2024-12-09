/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import {
	Plugin,
	TFile,
	Notice,
	Modal as ObsidianModal,
	Setting,
	MarkdownView,
	getAllTags,
} from 'obsidian';
import { InsightEngineSettings, DEFAULT_SETTINGS } from '../models/types';
import { TagGenerator } from '../services/tagGenerator';
import { NoteSummaryService } from '../services/noteSummary';
import { TagSuggestionModal } from '../ui/TagSuggestionModal';
import { LoadingModal } from '../ui/LoadingModal';
import { LLMFactory } from '../services/llmFactory';
import { InsightEngineSettingTab } from '@/ui/SettingsTab';
import { SummaryModal } from '../ui/SummaryModal';
import { QuestionGenerator } from '../services/questionGenerator';
import { QuestionModal } from '../ui/QuestionModal';
import * as yaml from 'js-yaml';
import { TagManagerFactory } from '../services/tagManager';

// Add this type definition near the top of the file, after other imports
type TagSuggestion = {
	name: string;
	isExisting: boolean;
	suggestedByLLM: boolean;
};

/**
 * This class is the entrypoint for the InsightEngine plugin.
 * It provides the UI integration points for the plugin such as the settings tab and the command for analyzing the current note.
 * It also provides the core functionality for generating tags for a note.
 */
export default class InsightEngine extends Plugin {
	settings: InsightEngineSettings;
	tagGenerator: TagGenerator;
	noteSummaryService: NoteSummaryService;
	questionGenerator: QuestionGenerator;
	existingTags: Set<string> = new Set();

	async onload() {
		console.log('InsightEngine: Starting plugin load');
		await this.loadSettings();
		console.log('InsightEngine: Settings loaded:', this.settings);

		// Add settings tab first, before trying to initialize the generator
		this.addSettingTab(new InsightEngineSettingTab(this.app, this));
		console.log('InsightEngine: Settings tab added');

		// Try to initialize the services
		this.initializeServices();

		// Add command to generate tags for current note
		try {
			console.log('InsightEngine: Attempting to register tag generation command');
			this.addCommand({
				id: 'obsidian-insight-engine-generate-tags',
				name: 'Generate Tags for Current Note',
				// Add a check if we're in an editor context
				checkCallback: (checking: boolean) => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (activeView?.file) {
						if (!checking) {
							console.log('InsightEngine: Tag generation command executed');
							if (!this.tagGenerator) {
								console.warn('InsightEngine: Tag generator not initialized');
								new Notice('Please configure the LLM settings first.');
								return;
							}
							this.generateTagsForNote(activeView.file);
						}
						return true;
					}
					return false;
				},
			});
			console.log('InsightEngine: Tag generation command registered successfully');
		} catch (error) {
			console.error('InsightEngine: Failed to register tag generation command:', error);
		}

		// Add command to summarize current note
		try {
			console.log('InsightEngine: Attempting to register summarize command');
			this.addCommand({
				id: 'obsidian-insight-engine-summarize',
				name: 'Summarize Current Note',
				// Add a check if we're in an editor context
				checkCallback: (checking: boolean) => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (activeView?.file) {
						if (!checking) {
							console.log('InsightEngine: Summarize command executed');
							if (!this.noteSummaryService) {
								console.warn('InsightEngine: Summary service not initialized');
								new Notice('Please configure the LLM settings first.');
								return;
							}
							this.summarizeNote(activeView.file);
						}
						return true;
					}
					return false;
				},
			});
			console.log('InsightEngine: Summarize command registered successfully');
		} catch (error) {
			console.error('InsightEngine: Failed to register summarize command:', error);
		}

		// Add command to generate questions for current note
		try {
			console.log('InsightEngine: Attempting to register question generation command');
			this.addCommand({
				id: 'obsidian-insight-engine-generate-questions',
				name: 'Generate Questions from Current Note',
				checkCallback: (checking: boolean) => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (activeView?.file) {
						if (!checking) {
							console.log('InsightEngine: Question generation command executed');
							if (!this.questionGenerator) {
								console.warn('InsightEngine: Question generator not initialized');
								new Notice('Please configure the LLM settings first.');
								return;
							}
							this.generateQuestionsForNote(activeView.file);
						}
						return true;
					}
					return false;
				},
			});
			console.log('InsightEngine: Question generation command registered successfully');
		} catch (error) {
			console.error('InsightEngine: Failed to register question generation command:', error);
		}
	}

	public async initializeServices() {
		console.log('InsightEngine: Starting services initialization');
		// check if the required settings are configured
		const configError = LLMFactory.validateConfig(this.settings.llmProvider, this.settings);
		if (configError) {
			console.error('InsightEngine: Configuration error:', configError);
			new Notice(configError);
			return;
		}
		try {
			console.log(
				'InsightEngine: Creating LLM model with provider:',
				this.settings.llmProvider
			);
			const model = LLMFactory.createModel(
				this.settings.llmProvider,
				this.settings.modelName,
				{
					llmHost: this.settings.llmHost,
					temperature: 0,
					maxRetries: 2,
					apiKey: this.settings.apiKey,
				}
			);

			if (!model) {
				console.error('InsightEngine: Failed to create LLM model');
				new Notice(
					'Services are disabled until configuration is complete. Please check settings.'
				);
				return;
			}

			this.tagGenerator = new TagGenerator(model, this.settings.tagStyle);
			this.noteSummaryService = new NoteSummaryService(model);
			this.questionGenerator = new QuestionGenerator(model);
			console.log('InsightEngine: Services initialized successfully');
		} catch (error) {
			// If initialization fails, we'll show a notice but not prevent the plugin from loading
			console.error('InsightEngine: Failed to initialize services:', error);
			new Notice(
				'Services are disabled until configuration is complete. Please check settings.'
			);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.initializeServices();
	}

	public async getAllVaultTags(): Promise<Set<string>> {
		const tags = new Set<string>();
		const files = this.app.vault.getMarkdownFiles();

		files.forEach((file) => {
			const fileCache = this.app.metadataCache.getFileCache(file);
			if (fileCache && fileCache.tags) {
				fileCache.tags.forEach((tag) => {
					tags.add(tag.tag.substring(1)); // Remove the '#' prefix
				});
			}
		});

		console.log('InsightEngine: Found vault tags:', Array.from(tags));
		return tags;
	}

	public async handleLLMError(error: Error, loadingModal?: LoadingModal) {
		console.error('InsightEngine: Operation failed:', error);
		loadingModal?.close();

		if (error.message?.includes('Ollama server is not running')) {
			new Notice(
				'Error: Ollama server is not running. Please start it using the command: "ollama serve"',
				10000
			);
		} else if (error.name !== 'AbortError') {
			new Notice('Operation failed. Please check the console for details.');
		}
	}

	public async withLoadingModal<T>(
		message: string,
		operation: () => Promise<T>
	): Promise<T | undefined> {
		const loadingModal = new LoadingModal(this.app, message);
		loadingModal.open();

		try {
			const result = await operation();
			loadingModal.close();
			return result;
		} catch (error) {
			this.handleLLMError(error, loadingModal);
			return undefined;
		}
	}

	private formatTag(tag: string): string {
		return tag.startsWith('#') ? tag : `#${tag}`;
	}

	public async testGenerateTagsForNote(file: TFile) {
		return this.generateTagsForNote(file);
	}

	public async generateTagsForNote(file: TFile) {
		const result = await this.withLoadingModal('Generating tags...', async () => {
			const content = await this.app.vault.read(file);
			const vaultTags = await this.getAllVaultTags();
			return await this.tagGenerator.suggestTags(content, vaultTags);
		});

		if (!result || result.length === 0) {
			new Notice('No tags were suggested for this note.');
			return;
		}

		const fileCache = this.app.metadataCache.getFileCache(file);
		const existingNoteTags = new Set(
			((fileCache && getAllTags(fileCache)) || []).map((tag) => tag.substring(1))
		);

		const vaultTags = await this.getAllVaultTags();
		const tagSuggestions = result.map((tag) => ({
			name: tag,
			isExisting: vaultTags.has(tag.replace('#', '')),
			suggestedByLLM: true,
		}));

		new TagSuggestionModal(
			this.app,
			tagSuggestions,
			existingNoteTags,
			async (selectedTags: string[], tagsToRemove: string[]) => {
				if (selectedTags.length > 0 || tagsToRemove.length > 0) {
					await this.appendTagsToNote(file, selectedTags, tagsToRemove);
				}
			}
		).open();
	}

	public async summarizeNote(file: TFile) {
		const result = await this.withLoadingModal('Generating summary...', async () => {
			const content = await this.app.vault.read(file);
			return await this.noteSummaryService.generateSummary(content);
		});

		if (!result) return;

		if (result.error) {
			new Notice(`Error generating summary: ${result.error}`);
			return;
		}

		if (result.summary) {
			new SummaryModal(this.app, result.summary, this).open();
		} else {
			new Notice('No summary was generated for this note.');
		}
	}

	public async generateQuestionsForNote(file: TFile) {
		const questions = await this.withLoadingModal(
			'Generating questions from your note...',
			async () => {
				const content = await this.app.vault.read(file);
				return await this.questionGenerator.generateQuestions(content);
			}
		);

		if (questions) {
			new QuestionModal(this.app, questions, this).open();
		}
	}

	public async appendTagsToNote(file: TFile, tags: string[], tagsToRemove: string[] = []) {
		console.log(`[InsightEngine] Appending tags to note "${file.path}":
            Adding tags: ${tags.join(', ')}
            Removing tags: ${tagsToRemove.join(', ')}`);
		const content = await this.app.vault.read(file);
		const tagManager = TagManagerFactory.create(
			this.settings.tagFormat,
			this.settings.tagLocation
		);

		const existingTags = tagManager.getExistingTags(content);

		// Check for duplicate tags case-insensitively, ignoring # prefix
		const uniqueNewTags = tags.filter(
			(tag) =>
				!existingTags.some(
					(existingTag) =>
						existingTag.toLowerCase().replace(/^#/, '') ===
						tag.toLowerCase().replace(/^#/, '')
				)
		);

		// Only modify if there are unique new tags or tags to remove
		const shouldModify = uniqueNewTags.length > 0 || tagsToRemove.length > 0;

		if (shouldModify) {
			console.log(`[InsightEngine] Modifying tags for note "${file.path}":
                Adding tags: ${uniqueNewTags.join(', ')}
                Removing tags: ${tagsToRemove.join(', ')}`);

			this.notifyTagChanges(existingTags, tags, tagsToRemove);

			const modifiedContent = tagManager.updateTags(content, uniqueNewTags, tagsToRemove);

			await this.app.vault.modify(file, modifiedContent);
		}
	}

	private notifyTagChanges(existingTags: string[], addedTags: string[], removedTags: string[]) {
		const added = addedTags.filter((tag) => !existingTags.includes(tag));
		const removed = removedTags.filter((tag) =>
			existingTags.some(
				(existing) =>
					existing.toLowerCase() ===
					(tag.startsWith('#') ? tag.slice(1) : tag).toLowerCase()
			)
		);

		const message = [
			added.length > 0 ? `Added tags: ${added.join(' ')}` : '',
			removed.length > 0 ? `Removed tags: ${removed.join(' ')}` : '',
		]
			.filter(Boolean)
			.join('\n');

		if (message) new Notice(message);
	}
}
