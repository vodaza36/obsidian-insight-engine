import { Plugin, TFile } from 'obsidian';
import { TagGenerator } from './services/tagGenerator';
import type { TagSuggestion } from './types/TagSuggestion';

export default class TagAgent extends Plugin {
	private tagGenerator: TagGenerator;
	private abortController: AbortController | null = null;

	async onload() {
		this.tagGenerator = new TagGenerator('http://localhost:11434', 'llama3.1');

		// Add a ribbon icon, which shows the sample modal when clicked
		const ribbonIconEl = this.addRibbonIcon('tag', 'Tag Agent', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.activateTagAgent();
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('tag-agent-ribbon-class');

		// Add a command to suggest tags
		this.addCommand({
			id: 'suggest-tags',
			name: 'Suggest Tags',
			callback: () => {
				this.activateTagAgent();
			}
		});
	}

	onunload() {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
	}

	private async activateTagAgent() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return;
		}

		// Create a new AbortController for this operation
		if (this.abortController) {
			this.abortController.abort();
		}
		this.abortController = new AbortController();

		try {
			const fileContent = await this.app.vault.read(activeFile);
			const existingTags = this.getExistingTags(activeFile);

			const suggestedTags = await this.tagGenerator.suggestTags(
				fileContent,
				existingTags,
				this.abortController.signal
			);

			if (suggestedTags.length > 0) {
				const tagsToAdd = suggestedTags
					.filter((tag: string) => !existingTags.has(tag));

				if (tagsToAdd.length > 0) {
					await this.appendTagsToFile(activeFile, tagsToAdd);
				} else {
					// Show a notice if no new tags were suggested
					this.displayNotice('No new tags to suggest.');
				}
			}
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error suggesting tags:', error);
				this.displayNotice('Error suggesting tags. Please check the console for details.');
			}
		} finally {
			this.abortController = null;
		}
	}

	private getExistingTags(file: TFile): Set<string> {
		const existingTags = new Set<string>();

		// Get tags from cache
		const cache = this.app.metadataCache.getFileCache(file);
		if (cache?.tags) {
			cache.tags.forEach(tagCache => existingTags.add(tagCache.tag));
		}

		// Get tags from frontmatter if they exist
		if (cache?.frontmatter?.tags) {
			const frontmatterTags = Array.isArray(cache.frontmatter.tags)
				? cache.frontmatter.tags
				: [cache.frontmatter.tags];
			frontmatterTags.forEach((tag: string) => existingTags.add(`#${tag}`));
		}

		return existingTags;
	}

	private async appendTagsToFile(file: TFile, tags: string[]) {
		try {
			const content = await this.app.vault.read(file);
			const newContent = this.addTagsToContent(content, tags);
			await this.app.vault.modify(file, newContent);
			this.displayNotice(`Added tags: ${tags.join(', ')}`);
		} catch (error) {
			console.error('Error appending tags:', error);
			this.displayNotice('Error adding tags to file.');
		}
	}

	private addTagsToContent(content: string, tags: string[]): string {
		// If the content is empty, just add the tags
		if (!content.trim()) {
			return tags.join(' ');
		}

		// Add tags at the end of the file with a newline
		return `${content}\n${tags.join(' ')}`;
	}

	private displayNotice(message: string) {
		this.app.workspace.trigger('tag-agent:notice', message);
	}
}
