import { App, Modal, Setting } from 'obsidian';

export class TagSuggestionModal extends Modal {
	private suggestedTags: string[];
	private callback: (selectedTags: string[]) => void;
	private selectedTags: Set<string> = new Set();

	constructor(app: App, suggestedTags: string[], callback: (selectedTags: string[]) => void) {
		super(app);
		this.suggestedTags = suggestedTags;
		this.callback = callback;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Suggested Tags' });
		contentEl.createEl('p', { text: 'Select the tags you want to add to your note:' });

		this.suggestedTags.forEach((tag) => {
			new Setting(contentEl)
				.addToggle((toggle) =>
					toggle.onChange((value) => {
						if (value) {
							this.selectedTags.add(tag);
						} else {
							this.selectedTags.delete(tag);
						}
					})
				)
				.setName(tag);
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
