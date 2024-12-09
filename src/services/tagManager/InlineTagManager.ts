import { TagManager, TagLocation } from './TagManager';

export class InlineTagManager implements TagManager {
	constructor(private tagLocation: TagLocation = 'bottom') {}

	private formatTag(tag: string): string {
		return tag.startsWith('#') ? tag : '#' + tag;
	}

	getExistingTags(content: string): string[] {
		// Find inline tags
		const tagMatches = content.match(/(^|\s)#[\w-]+/g);
		return tagMatches ? tagMatches.map((tag) => tag.trim()) : [];
	}

	updateTags(content: string, tagsToAdd: string[], tagsToRemove: string[] = []): string {
		const existingTags = this.getExistingTags(content);
		const tags = [
			...new Set([
				...existingTags.filter((tag) => !tagsToRemove.includes(tag.replace('#', ''))),
				...tagsToAdd.map((tag) => this.formatTag(tag)),
			]),
		];

		// Split content into lines
		const lines = content.split('\n');
		const nonEmptyLines = lines.filter((line) => line.trim() !== '');
		const tagLineIndex = nonEmptyLines.findIndex((line) => /(^|\s)#[\w-]+/g.test(line));

		// Format tags (ensure # prefix)
		const formattedTags = tags.join(' ');

		// If no tags left, remove tag line and return
		if (tags.length === 0) {
			if (tagLineIndex !== -1) {
				nonEmptyLines.splice(tagLineIndex, 1);
			}
			return nonEmptyLines.join('\n');
		}

		// Remove existing tag line if present
		if (tagLineIndex !== -1) {
			nonEmptyLines.splice(tagLineIndex, 1);
		}

		// Add tags at the specified location
		if (this.tagLocation === 'top') {
			return (
				formattedTags + '\n\n' + (nonEmptyLines.length > 0 ? nonEmptyLines.join('\n') : '')
			);
		} else {
			return (
				(nonEmptyLines.length > 0 ? nonEmptyLines.join('\n') + '\n\n' : '') + formattedTags
			);
		}
	}
}
