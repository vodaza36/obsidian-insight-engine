/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { App, Modal } from 'obsidian';

/**
 * A modal that displays a loading message and provides a way to cancel the underlying operation.
 * It is used to prevent the user from interacting with the app while a long-running operation is in progress.
 */

export class LoadingModal extends Modal {
	private message: string;

	constructor(app: App, message: string) {
		super(app);
		this.message = message;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Add the main class to the modal
		contentEl.addClass('insight-engine-loading-modal');

		// Title
		contentEl.createEl('h3', {
			text: 'Processing...',
			cls: 'insight-engine-loading-title',
		});

		// Loading spinner
		const spinner = contentEl.createEl('div', {
			cls: 'insight-engine-loading-spinner loading-spinner',
		});

		// Loading message
		contentEl.createEl('p', {
			text: this.message,
			cls: 'insight-engine-loading-message',
		});

		// Additional info text
		contentEl.createEl('p', {
			text: 'Insight Engine is analyzing your content. This may take a few moments based on content length.',
			cls: 'insight-engine-loading-info',
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
