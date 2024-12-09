/**
 * Interface for managing tags in notes
 */
export interface TagManager {
	/**
	 * Get existing tags from the note content
	 * @param content The note content
	 * @returns Array of existing tags
	 */
	getExistingTags(content: string): string[];

	/**
	 * Update tags in the note content
	 * @param content The note content
	 * @param tagsToAdd Tags to add
	 * @param tagsToRemove Tags to remove
	 * @returns Updated note content
	 */
	updateTags(content: string, tagsToAdd: string[], tagsToRemove?: string[]): string;
}

export type TagFormat = 'property' | 'line';
export type TagLocation = 'top' | 'bottom';
