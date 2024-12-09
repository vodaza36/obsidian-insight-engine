import { describe, it, expect, vi } from 'vitest';
import InsightEngine from '../../src/main';

// Mock the obsidian module
vi.mock('obsidian', () => ({
	Plugin: class MockPlugin {
		onload() {}
		onunload() {}
	},
	Modal: class MockModal {
		constructor() {}
		open() {}
		close() {}
	},
	Notice: class MockNotice {
		constructor() {}
	},
	Setting: class MockSetting {
		constructor() {}
	},
	MarkdownView: class MockMarkdownView {
		constructor() {}
	},
	PluginSettingTab: class MockPluginSettingTab {
		constructor() {}
		display() {}
		hide() {}
	},
	getAllTags: vi.fn().mockReturnValue([]),
	TFile: class MockTFile {
		constructor() {}
	},
}));

describe('main.ts', () => {
	it('should export InsightEngine class', () => {
		expect(InsightEngine).toBeDefined();
		// Verify it's a class by checking its prototype
		expect(InsightEngine.prototype).toBeDefined();
		// Verify it has the expected plugin methods
		expect(typeof InsightEngine.prototype.onload).toBe('function');
		expect(typeof InsightEngine.prototype.onunload).toBe('function');
	});
});
