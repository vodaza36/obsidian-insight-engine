/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { App, Modal, Setting, Notice } from 'obsidian';

interface TagSuggestion {
	name: string;
	isExisting: boolean;
	suggestedByLLM: boolean;
}

export class TagSuggestionModal extends Modal {
	private suggestedTags: TagSuggestion[];
	private selectedTags: Set<string>;
	private existingNoteTags: Set<string>;
	private tagsToRemove: Set<string>;
	private callback: (selectedTags: string[], tagsToRemove: string[]) => void;
	private shouldCallCallback: boolean = true;

	constructor(
		app: App,
		suggestedTags: TagSuggestion[],
		existingNoteTags: Set<string>,
		callback: (selectedTags: string[], tagsToRemove: string[]) => void
	) {
		super(app);
		this.suggestedTags = suggestedTags;
		this.selectedTags = new Set<string>();
		this.existingNoteTags = existingNoteTags;
		this.tagsToRemove = new Set<string>();
		this.callback = callback;

		// Pre-select tags that already exist on the note
		suggestedTags.forEach((tag) => {
			const tagName = tag.name.replace(/^#/, '').toLowerCase();
			if (this.existingNoteTags.has(tagName)) {
				this.selectedTags.add(tag.name);
			}
		});
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Suggested Tags' });
		contentEl.createEl('p', { text: 'Select tags to add:' });

		// Group tags
		const existingTags = this.suggestedTags.filter(
			(tag) => tag.isExisting && tag.suggestedByLLM
		);
		const newTags = this.suggestedTags.filter((tag) => !tag.isExisting);

		// Create container for better styling
		const tagsContainer = contentEl.createDiv({
			cls: 'tag-suggestions-container',
		});

		// Existing Tags Section
		if (existingTags.length > 0) {
			const existingSection = tagsContainer.createDiv({
				cls: 'tags-section existing-tags-section',
			});

			existingSection.createEl('h3', {
				text: 'Existing Tags',
				cls: 'section-header',
			});

			const existingTagsContainer = existingSection.createDiv({
				cls: 'tags-group',
			});

			existingTags.forEach((tag) => this.createTagToggle(existingTagsContainer, tag));
		}

		// New Tags Section
		if (newTags.length > 0) {
			const newSection = tagsContainer.createDiv({
				cls: 'tags-section new-tags-section',
			});

			newSection.createEl('h3', {
				text: 'New Tags',
				cls: 'section-header',
			});

			const newTagsContainer = newSection.createDiv({
				cls: 'tags-group',
			});

			newTags.forEach((tag) => this.createTagToggle(newTagsContainer, tag));
		}

		// Add button at the bottom
		const buttonContainer = contentEl.createDiv({
			cls: 'button-container',
		});

		new Setting(buttonContainer)
			.addButton((btn) =>
				btn.setButtonText('Copy to Clipboard').onClick(() => {
					const selectedTagsArray = Array.from(this.selectedTags);
					if (selectedTagsArray.length > 0) {
						navigator.clipboard
							.writeText(selectedTagsArray.join(' '))
							.then(() => {
								new Notice('Tags copied to clipboard!');
								this.shouldCallCallback = false;
								this.close();
							})
							.catch(() => {
								new Notice('Failed to copy tags to clipboard');
							});
					} else {
						new Notice('No tags selected to copy');
						this.shouldCallCallback = false;
						this.close();
					}
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText('Add Selected Tags')
					.setCta()
					.onClick(() => {
						this.close();
					})
			);
	}

	private createTagToggle(container: HTMLElement, tag: TagSuggestion) {
		const tagName = tag.name.replace(/^#/, '');
		const isOnNote = this.existingNoteTags.has(tagName.toLowerCase());
		new Setting(container)
			.setName(tagName)
			.setDesc(isOnNote ? 'Already on note' : '')
			.addToggle((toggle) => {
				toggle.setValue(isOnNote);
				toggle.onChange((value) => {
					if (value) {
						this.selectedTags.add(tagName);
						this.tagsToRemove.delete(tagName);
					} else {
						this.selectedTags.delete(tagName);
						if (isOnNote) {
							this.tagsToRemove.add(tagName);
						}
					}
				});
			});
	}

	private closeWithoutCallback() {
		const { contentEl } = this;
		contentEl.empty();
		super.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		if (this.shouldCallCallback) {
			this.callback(Array.from(this.selectedTags), Array.from(this.tagsToRemove));
		}
	}
}
