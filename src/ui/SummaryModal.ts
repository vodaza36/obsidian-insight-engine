import { App, Modal, Setting } from 'obsidian';

export class SummaryModal extends Modal {
    private summary: string;
    
    constructor(app: App, summary: string) {
        super(app);
        this.summary = summary;
    }

    onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl('h2', { text: 'Note Summary' });
        
        const summaryContainer = contentEl.createDiv({ cls: 'summary-content' });
        summaryContainer.createEl('p', { text: this.summary });

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
