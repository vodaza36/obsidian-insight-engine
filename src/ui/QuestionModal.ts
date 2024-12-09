import { App, Modal, Component, Notice } from 'obsidian';
import { MarkdownRenderer } from 'obsidian';

export class QuestionModal extends Modal {
	private questions: string[];
	private component: Component;

	constructor(app: App, questions: string[], component: Component) {
		super(app);
		this.questions = questions;
		this.component = component;
	}

	private async copyToClipboard(text: string): Promise<void> {
		await navigator.clipboard.writeText(text);
		new Notice('Questions copied to clipboard!');
		this.close();
	}

	private createButton(
		container: HTMLElement,
		text: string,
		callback: () => void
	): HTMLButtonElement {
		const button = container.createEl('button', {
			text: text,
			cls: ['mod-cta', 'copy-button'],
		});
		button.addEventListener('click', callback);
		return button;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Generated Questions' });

		const questionsContainer = contentEl.createDiv({ cls: 'questions-content' });

		// Convert questions array to markdown list
		const markdownQuestions = this.questions.map((q) => `- ${q}`).join('\n');

		if (this.questions.length === 0) {
			questionsContainer.createEl('p', {
				text: 'No relevant questions could be generated from this note.',
				cls: 'no-questions-message',
			});
		} else {
			await MarkdownRenderer.renderMarkdown(
				markdownQuestions,
				questionsContainer,
				'',
				this.component
			);

			contentEl.createEl('p', {
				text: `${this.questions.length} questions generated`,
				cls: 'questions-count',
			});

			const buttonContainer = contentEl.createDiv({ cls: 'button-container' });
			this.createButton(buttonContainer, 'Copy to Clipboard', () =>
				this.copyToClipboard(markdownQuestions)
			);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
