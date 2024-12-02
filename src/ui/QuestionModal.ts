import { App, Modal, Setting, Component, Notice } from 'obsidian';
import { MarkdownRenderer } from 'obsidian';

export class QuestionModal extends Modal {
    private questions: string[];
    private component: Component;
    
    constructor(app: App, questions: string[], component: Component) {
        super(app);
        this.questions = questions;
        this.component = component;
    }

    async onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl('h2', { text: 'Generated Questions' });
        
        const questionsContainer = contentEl.createDiv({ cls: 'questions-content' });
        
        // Convert questions array to markdown list
        const markdownQuestions = this.questions.map(q => `- ${q}`).join('\n');
        
        await MarkdownRenderer.renderMarkdown(
            markdownQuestions,
            questionsContainer,
            '',
            this.component
        );

        // Add a message if no questions were generated
        if (this.questions.length === 0) {
            questionsContainer.createEl('p', {
                text: 'No relevant questions could be generated from this note.',
                cls: 'no-questions-message'
            });
        } else {
            // Add the number of questions generated
            contentEl.createEl('p', {
                text: `${this.questions.length} questions generated`,
                cls: 'questions-count'
            });
        }

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Copy to Clipboard')
                    .setCta()
                    .onClick(async () => {
                        await navigator.clipboard.writeText(markdownQuestions);
                        // Show a notice that questions were copied
                        new Notice('Questions copied to clipboard!');
                        this.close();
                    }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
