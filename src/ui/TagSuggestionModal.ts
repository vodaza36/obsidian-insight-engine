import { App, Modal, Setting } from 'obsidian';

interface TagSuggestion {
    name: string;
    isExisting: boolean;
}

export class TagSuggestionModal extends Modal {
    private suggestedTags: TagSuggestion[];
    private selectedTags: Set<string>;
    private existingNoteTags: Set<string>;
    private callback: (selectedTags: string[]) => void;

    constructor(
        app: App, 
        suggestedTags: TagSuggestion[], 
        existingNoteTags: Set<string>,
        callback: (selectedTags: string[]) => void
    ) {
        super(app);
        this.suggestedTags = suggestedTags;
        this.selectedTags = new Set<string>();
        this.existingNoteTags = existingNoteTags;
        this.callback = callback;

        // Pre-select tags that already exist on the note
        suggestedTags.forEach(tag => {
            if (this.existingNoteTags.has(tag.name.replace('#', ''))) {
                this.selectedTags.add(tag.name);
            }
        });
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Suggested Tags' });
        contentEl.createEl('p', { text: 'Select the tags you want to add to your note:' });

        // Group tags
        const existingTags = this.suggestedTags.filter(tag => tag.isExisting);
        const newTags = this.suggestedTags.filter(tag => !tag.isExisting);

        // Create container for better styling
        const tagsContainer = contentEl.createDiv({
            cls: 'tag-suggestions-container'
        });

        // Existing Tags Section
        if (existingTags.length > 0) {
            const existingSection = tagsContainer.createDiv({
                cls: 'tags-section existing-tags-section'
            });

            existingSection.createEl('h3', {
                text: 'Existing Tags',
                cls: 'section-header'
            });

            const existingTagsContainer = existingSection.createDiv({
                cls: 'tags-group'
            });

            existingTags.forEach(tag => this.createTagToggle(existingTagsContainer, tag));
        }

        // New Tags Section
        if (newTags.length > 0) {
            const newSection = tagsContainer.createDiv({
                cls: 'tags-section new-tags-section'
            });

            newSection.createEl('h3', {
                text: 'New Tags',
                cls: 'section-header'
            });

            const newTagsContainer = newSection.createDiv({
                cls: 'tags-group'
            });

            newTags.forEach(tag => this.createTagToggle(newTagsContainer, tag));
        }

        // Add button at the bottom
        const buttonContainer = contentEl.createDiv({
            cls: 'button-container'
        });

        new Setting(buttonContainer)
            .addButton((btn) =>
                btn
                    .setButtonText('Add Selected Tags')
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.callback(Array.from(this.selectedTags));
                    })
            );
    }

    private createTagToggle(container: HTMLElement, tag: TagSuggestion) {
        const isOnNote = this.existingNoteTags.has(tag.name.replace('#', ''));
        new Setting(container)
            .setName(tag.name)
            .setDesc(isOnNote ? 'Already on note' : '')
            .addToggle(toggle => {
                if (isOnNote) {
                    toggle.setValue(true);
                }
                toggle.onChange(value => {
                    if (value) {
                        this.selectedTags.add(tag.name);
                    } else {
                        this.selectedTags.delete(tag.name);
                    }
                });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        this.callback(Array.from(this.selectedTags));
    }
}
