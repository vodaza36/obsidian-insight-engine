import { App, Modal, Setting, Component } from 'obsidian';
import { MarkdownRenderer } from 'obsidian';

export class SummaryModal extends Modal {
	private summary: string;
	private component: Component;

	constructor(app: App, summary: string, component: Component) {
		super(app);
		this.summary = summary;
		this.component = component;
	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', {
			text: 'Note Summary',
			cls: 'summary-modal-title',
		});

		const summaryContainer = contentEl.createDiv({
			cls: 'summary-modal-content',
		});

		const summaryText = summaryContainer.createDiv({
			cls: 'summary-modal-text',
		});

		// Use Obsidian's markdown renderer
		await MarkdownRenderer.renderMarkdown(this.summary, summaryText, '', this.component);

		const buttonContainer = contentEl.createDiv({
			cls: 'summary-modal-button-container',
		});

		new Setting(buttonContainer).addButton((btn) =>
			btn
				.setButtonText('Copy to Clipboard')
				.setCta()
				.onClick(async () => {
					await navigator.clipboard.writeText(this.summary);
					this.close();
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
