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

		// Add styles
		contentEl.createEl('style', {
			text: `
                .summary-modal-title {
                    color: var(--text-accent);
                    margin-bottom: 20px;
                    font-size: 24px;
                }
                .summary-modal-content {
                    padding: 0 10px;
                }
                .summary-modal-text {
                    margin-bottom: 20px;
                    max-height: 300px;
                    overflow-y: auto;
                    font-family: var(--font-text);
                }
                .summary-modal-button-container {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
                .summary-modal-button-container .setting-item {
                    border: none;
                    padding: 0;
                }
                .summary-modal-button-container button {
                    background-color: var(--interactive-accent);
                    color: var(--text-on-accent);
                    padding: 8px 16px;
                    border-radius: 4px;
                }
            `,
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
