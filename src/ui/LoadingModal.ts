import { App, Modal, Setting } from 'obsidian';

/**
 * A modal that displays a loading message and provides a way to cancel the underlying operation.
 * It is used to prevent the user from interacting with the app while a long-running operation is in progress.
 */

export class LoadingModal extends Modal {
    private message: string;
    private onCancel: () => void;

    constructor(app: App, message: string, onCancel: () => void) {
        super(app);
        this.message = message;
        this.onCancel = onCancel;
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
                        this.close();
                        this.onCancel();
                    })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
