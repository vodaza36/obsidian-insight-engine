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

		// Reset any default modal padding
		contentEl.style.padding = '0';
		contentEl.style.marginTop = '0';

		// Title
		contentEl.createEl('h3', {
			text: 'Processing...',
			attr: { style: 'margin: 0 0 10px 0; color: var(--text-normal);' },
		});

		// Loading spinner
		const spinner = contentEl.createEl('div', {
			cls: 'loading-spinner',
			attr: { style: 'margin: 0 auto 10px auto; display: flex; justify-content: center;' },
		});

		// Loading message
		contentEl.createEl('p', {
			text: this.message,
			attr: { style: 'margin-bottom: 10px;' },
		});

		// Additional info text
		contentEl.createEl('p', {
			text: 'Insight Engine is analyzing your content. This may take a few moments based on content length.',
			attr: { style: 'margin-bottom: 10px; font-size: 0.8em; color: var(--text-muted);' },
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
