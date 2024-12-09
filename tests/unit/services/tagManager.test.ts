import { describe, it, expect } from 'vitest';
import {
	FrontmatterTagManager,
	InlineTagManager,
	TagManagerFactory,
} from '../../../src/services/tagManager';

describe('TagManagerFactory', () => {
	it('should create FrontmatterTagManager for property format', () => {
		const manager = TagManagerFactory.create('property');
		expect(manager).toBeInstanceOf(FrontmatterTagManager);
	});

	it('should create InlineTagManager for line format', () => {
		const manager = TagManagerFactory.create('line');
		expect(manager).toBeInstanceOf(InlineTagManager);
	});
});

describe('FrontmatterTagManager', () => {
	const manager = new FrontmatterTagManager();

	describe('getExistingTags', () => {
		it('should extract tags from frontmatter', () => {
			const content = '---\ntags:\n  - tag1\n  - tag2\nauthor: Max\n---\nContent';
			expect(manager.getExistingTags(content)).toEqual(['tag1', 'tag2']);
		});

		it('should handle empty frontmatter', () => {
			const content = '---\n---\nContent';
			expect(manager.getExistingTags(content)).toEqual([]);
		});

		it('should handle no frontmatter', () => {
			const content = 'Just content';
			expect(manager.getExistingTags(content)).toEqual([]);
		});
	});

	describe('updateTags', () => {
		it('should add new tags to existing frontmatter', () => {
			const content = '---\ntags:\n  - existing\nauthor: Max\n---\nContent';
			const result = manager.updateTags(content, ['newtag']);
			expect(result).toContain('tags:\n  - existing\n  - newtag');
		});

		it('should remove specified tags', () => {
			const content = '---\ntags:\n  - tag1\n  - tag2\n  - tag3\n---\nContent';
			const result = manager.updateTags(content, [], ['tag2']);
			expect(result).toContain('tags:\n  - tag1\n  - tag3');
		});

		it('should create frontmatter when none exists', () => {
			const content = 'Just content';
			const result = manager.updateTags(content, ['newtag']);
			expect(result).toBe('---\ntags:\n  - newtag\n---\nJust content');
		});

		it('should always use list format when adding new tags', () => {
			const content = '---\ntags:\n  - tag1\n  - tag2\n---\nContent';
			const result = manager.updateTags(content, ['tag3']);
			expect(result).toContain('tags:\n  - tag1\n  - tag2\n  - tag3');
		});

		it('should handle empty tags correctly', () => {
			const content = '---\ntags:\n---\nContent';
			const result = manager.updateTags(content, ['tag1']);
			expect(result).toContain('tags:\n  - tag1');
		});

		it('should add tags when frontmatter exists without tags section', () => {
			const content = '---\nauthor: max\n---\nObsidian Plugin Development';
			const result = manager.updateTags(content, ['obsidian']);
			const expected =
				'---\nauthor: max\ntags:\n  - obsidian\n---\nObsidian Plugin Development';
			expect(result).toBe(expected);
		});

		it('should preserve other frontmatter fields when updating tags', () => {
			const content = '---\ntitle: Test\ntags:\n  - tag1\ndate: 2024-01-01\n---\nContent';
			const contentExpected =
				'---\ntitle: Test\ntags:\n  - tag2\ndate: 2024-01-01\n---\nContent';
			const result = manager.updateTags(content, ['tag2'], ['tag1']);
			expect(result).toContain('title: Test');
			expect(result).toMatch(contentExpected);
			expect(result).toContain('tags:\n  - tag2');
			expect(result).toContain('Content');
		});
	});
});

describe('InlineTagManager', () => {
	describe('getExistingTags', () => {
		const manager = new InlineTagManager();

		it('should extract inline tags', () => {
			const content = 'Content with #tag1 and #tag2';
			expect(manager.getExistingTags(content)).toEqual(['#tag1', '#tag2']);
		});

		it('should handle no tags', () => {
			const content = 'Just content';
			expect(manager.getExistingTags(content)).toEqual([]);
		});
	});

	describe('updateTags', () => {
		it('should add tags at top with proper newline', () => {
			const manager = new InlineTagManager('top');
			const content = 'Content\n#tag1 #tag2';
			const result = manager.updateTags(content, ['tag3'], ['tag1']);
			expect(result).toBe('#tag2 #tag3\n\nContent');
		});

		it('should add tags at bottom with proper newlines', () => {
			const manager = new InlineTagManager('bottom');
			const content = '#tag1 #tag2\nContent';
			const result = manager.updateTags(content, ['tag3'], ['tag1']);
			expect(result).toBe('Content\n\n#tag2 #tag3');
		});

		it('should add new tags when no content exists', () => {
			const manager = new InlineTagManager('top');
			const result = manager.updateTags('', ['newtag']);
			expect(result).toBe('#newtag\n\n');
		});

		it('should add new tags when no tags exist - top position', () => {
			const manager = new InlineTagManager('top');
			const content = 'Just content';
			const result = manager.updateTags(content, ['newtag']);
			expect(result).toBe('#newtag\n\nJust content');
		});

		it('should add new tags when no tags exist - bottom position', () => {
			const manager = new InlineTagManager('bottom');
			const content = 'Just content';
			const result = manager.updateTags(content, ['newtag']);
			expect(result).toBe('Just content\n\n#newtag');
		});
	});
});
