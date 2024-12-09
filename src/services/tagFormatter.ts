export type TagStyle =
	| 'default'
	| 'camelCase'
	| 'PascalCase'
	| 'snake_case'
	| 'kebab-case'
	| 'Train-Case'
	| 'UPPERCASE'
	| 'lowercase';

export class TagFormatter {
	private style: TagStyle;

	constructor(style: TagStyle = 'default') {
		this.style = style;
	}

	/**
	 * Gets the current tag formatting style
	 * @returns The current style name
	 */
	getStyle(): TagStyle {
		return this.style;
	}

	formatTag(tag: string, addPrefix: boolean = false): string {
		if (!tag) return '';

		// Remove # if present at the start
		let formattedTag = tag.replace(/^#/, '');

		// Replace special characters with spaces for consistent word separation
		formattedTag = formattedTag.replace(/[^a-zA-Z0-9\-_]/g, ' ');

		// Split into words
		const words = formattedTag
			.replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
			.replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
			.trim()
			.split(/\s+/);

		// Format based on style
		switch (this.style) {
			case 'camelCase':
				formattedTag = words
					.map((word, index) =>
						index === 0
							? word.toLowerCase()
							: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
					)
					.join('');
				break;

			case 'PascalCase':
				formattedTag = words
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
					.join('');
				break;

			case 'snake_case':
				formattedTag = words.map((word) => word.toLowerCase()).join('_');
				break;

			case 'Train-Case':
				formattedTag = words
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
					.join('-');
				break;

			case 'UPPERCASE':
				formattedTag = words.map((word) => word.toUpperCase()).join('_');
				break;

			case 'lowercase':
				formattedTag = words.map((word) => word.toLowerCase()).join('_');
				break;

			case 'kebab-case':
				formattedTag = words.map((word) => word.toLowerCase()).join('-');
				break;

			default: // default style is kebab-case
				formattedTag = words.map((word) => word.toLowerCase()).join('-');
				break;
		}

		return addPrefix ? `#${formattedTag}` : formattedTag;
	}
}
