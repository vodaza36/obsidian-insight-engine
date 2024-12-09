import { TagManager } from './TagManager';
import * as yaml from 'js-yaml';

export class FrontmatterTagManager implements TagManager {
	private formatTag(tag: string): string {
		// Always remove # prefix for frontmatter
		return tag.replace(/^#/, '');
	}

	private detectTagFormat(yamlContent: string): 'array' | 'list' {
		// Check if tags are in array format [tag1, tag2]
		const arrayMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
		if (arrayMatch) {
			return 'array';
		}
		return 'list';
	}

	private formatTagsAsArray(tags: string[]): string {
		return `tags: [${tags.join(', ')}]`;
	}

	private formatTagsAsList(tags: string[]): string {
		return `tags:\n  - ${tags.join('\n  - ')}`;
	}

	getExistingTags(content: string): string[] {
		// Try to find tags in YAML frontmatter
		const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (!yamlMatch) {
			return [];
		}

		try {
			const yamlContent = yamlMatch[1];
			const parsed = yaml.load(yamlContent) as any;

			if (!parsed || !parsed.tags) {
				return [];
			}

			// Handle both array and list formats
			const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
			return rawTags.map((tag) => this.formatTag(tag));
		} catch (e) {
			console.error('Failed to parse YAML frontmatter:', e);
			return [];
		}
	}

	updateTags(content: string, tagsToAdd: string[], tagsToRemove: string[] = []): string {
		const existingTags = this.getExistingTags(content);
		const formattedTagsToRemove = tagsToRemove.map((tag) => this.formatTag(tag));
		const formattedTagsToAdd = tagsToAdd.map((tag) => this.formatTag(tag));

		// Filter out tags that should be removed and add new tags
		const tags = [
			...new Set([
				...existingTags.filter(
					(tag) =>
						!formattedTagsToRemove.some(
							(removeTag) => tag.toLowerCase() === removeTag.toLowerCase()
						)
				),
				...formattedTagsToAdd,
			]),
		];

		const yamlSeparator = '---\n';
		const hasYamlHeader = content.startsWith(yamlSeparator);
		const endOfYamlIndex = hasYamlHeader
			? content.indexOf(yamlSeparator, yamlSeparator.length)
			: -1;
		const restContent = hasYamlHeader
			? content.slice(endOfYamlIndex + yamlSeparator.length)
			: content;

		// If no tags, remove YAML section if it only contains tags
		if (tags.length === 0) {
			if (!hasYamlHeader) {
				return content;
			}
			try {
				const yamlContent = content.slice(yamlSeparator.length, endOfYamlIndex);
				const parsed = yaml.load(yamlContent) as any;
				if (
					!parsed ||
					typeof parsed !== 'object' ||
					(Object.keys(parsed).length === 1 && 'tags' in parsed)
				) {
					return restContent;
				}
				delete parsed.tags;
				const newYaml = yaml.dump(parsed, {
					indent: 2,
					lineWidth: -1,
					quotingType: '"',
					forceQuotes: false,
					flowLevel: -1,
					schema: yaml.DEFAULT_SCHEMA,
				});
				return `${yamlSeparator}${newYaml}\n${yamlSeparator}${restContent}`;
			} catch (e) {
				console.error('Failed to parse YAML frontmatter:', e);
				return content;
			}
		}

		// If no YAML header, create one
		if (!hasYamlHeader) {
			return `${yamlSeparator}tags:\n  - ${tags.join('\n  - ')}\n${yamlSeparator}${content}`;
		}

		// Parse existing YAML content
		try {
			const yamlContent = content.slice(yamlSeparator.length, endOfYamlIndex);
			const parsed = yaml.load(yamlContent) as Record<string, any>;

			// Create a new object that preserves all original fields
			const updatedYaml = { ...parsed, tags };

			// Custom YAML dump to preserve original formatting
			const lines = yamlContent.split('\n');
			const originalLines: string[] = [];

			// Reconstruct YAML preserving original order and formatting
			Object.keys(parsed).forEach((key) => {
				const originalLine = lines.find((line) => line.trim().startsWith(`${key}:`));
				if (originalLine) {
					if (key === 'tags') {
						originalLines.push(`tags:\n  - ${updatedYaml.tags.join('\n  - ')}`);
					} else {
						originalLines.push(originalLine);
					}
				}
			});

			// Add new fields that weren't in the original YAML
			Object.keys(updatedYaml).forEach((key) => {
				if (!parsed[key]) {
					if (key === 'tags') {
						originalLines.push(`tags:\n  - ${updatedYaml.tags.join('\n  - ')}`);
					} else {
						originalLines.push(`${key}: ${updatedYaml[key]}`);
					}
				}
			});

			const finalYaml = originalLines.join('\n');

			return `${yamlSeparator}${finalYaml}\n${yamlSeparator}${restContent}`;
		} catch (e) {
			console.error('Failed to parse YAML frontmatter:', e);
			return content;
		}
	}
}
