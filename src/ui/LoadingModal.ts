import { App, Modal, Setting } from 'obsidian';

export class LoadingModal extends Modal {
    private abortController: AbortController;
    private message: string;
    private onCancel: () => void;

    constructor(app: App, message: string, onCancel: () => void) {
        super(app);
        this.message = message;
        this.onCancel = onCancel;
        this.abortController = new AbortController();
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('div', { 
            cls: 'loading-modal-content',
            attr: { style: 'text-align: center; padding: 20px;' }
        });

        // Loading spinner
        const spinner = contentEl.createEl('div', {
            cls: 'loading-spinner',
            attr: { style: 'margin-bottom: 15px;' }
        });

        // Loading message
        contentEl.createEl('p', { 
            text: this.message,
            attr: { style: 'margin-bottom: 15px;' }
        });

        // Cancel button
        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Cancel')
                    .onClick(() => {
                        this.abortController.abort();
                        this.close();
                        this.onCancel();
                    })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    getAbortSignal(): AbortSignal {
        return this.abortController.signal;
    }
}
