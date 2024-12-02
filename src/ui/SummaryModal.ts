import { App, Modal, Setting, MarkdownRenderer, Component } from 'obsidian';

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
        
        contentEl.createEl('h2', { text: 'Note Summary' });
        
        const summaryContainer = contentEl.createDiv({ cls: 'summary-content' });
        await MarkdownRenderer.renderMarkdown(
            this.summary,
            summaryContainer,
            '',
            this.component
        );

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Copy to Clipboard')
                    .setCta()
                    .onClick(async () => {
                        await navigator.clipboard.writeText(this.summary);
                        this.close();
                    }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
