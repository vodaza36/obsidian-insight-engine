import { App, Modal, Setting } from 'obsidian';

interface TagSuggestion {
    name: string;
    isExisting: boolean;
}

export class TagSuggestionModal extends Modal {
    private suggestedTags: TagSuggestion[];
    private selectedTags: Set<string>;
    private callback: (selectedTags: string[]) => void;

    constructor(app: App, suggestedTags: TagSuggestion[], callback: (selectedTags: string[]) => void) {
        super(app);
        this.suggestedTags = suggestedTags;
        this.selectedTags = new Set<string>();
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Suggested Tags' });
        contentEl.createEl('p', { text: 'Select the tags you want to add to your note:' });

        // Add legend for tag types
        const legendEl = contentEl.createEl('div', { 
            cls: 'tag-legend',
            attr: { style: 'margin-bottom: 15px; font-size: 0.8em;' }
        });
        
        legendEl.createEl('div', { 
            text: ' New tags',
            attr: { style: 'margin-bottom: 5px;' }
        });
        legendEl.createEl('div', { 
            text: ' Existing tags from vault',
            attr: { style: 'margin-bottom: 15px;' }
        });

        this.suggestedTags.forEach((tag) => {
            new Setting(contentEl)
                .setName(`${tag.isExisting ? '' : ''} ${tag.name}`)
                .addToggle((toggle) =>
                    toggle.onChange((value) => {
                        if (value) {
                            this.selectedTags.add(tag.name);
                        } else {
                            this.selectedTags.delete(tag.name);
                        }
                    })
                );
        });

        new Setting(contentEl).addButton((btn) =>
            btn
                .setButtonText('Add Selected Tags')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.callback(Array.from(this.selectedTags));
                })
        );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
