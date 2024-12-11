import { App, Modal } from 'obsidian';
import { LoadingModal } from '../../../src/ui/LoadingModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Obsidian's Modal class
vi.mock('obsidian', () => {
	const createMockElement = (tag: string, options: any = {}) => ({
		style: {},
		className: options.cls || '',
		textContent: options.text || '',
		empty: vi.fn(),
		createEl: vi.fn().mockImplementation((tag, opts) => createMockElement(tag, opts)),
		addClass: vi.fn(),
		attr: {},
		text: '',
	});

	return {
		App: vi.fn(),
		Modal: class MockModal {
			app: any;
			contentEl: any;

			constructor(app: any) {
				this.app = app;
				this.contentEl = createMockElement('div');
			}
		},
	};
});

describe('LoadingModal', () => {
	let app: App;
	let modal: LoadingModal;
	const testMessage = 'Processing your request...';

	beforeEach(() => {
		// Given: an app instance and a modal
		app = new App();
		modal = new LoadingModal(app, testMessage);
		// No need to create actual DOM elements, use the mock
		modal.contentEl.empty = vi.fn();
		modal.contentEl.createEl = vi.fn().mockReturnValue({
			style: {} as CSSStyleDeclaration,
			attr: {},
			text: '',
		});
	});

	describe('when opening the modal', () => {
		it('should create all UI elements with correct content', () => {
			// When: opening the modal
			modal.onOpen();

			// Then: it should create all necessary elements
			expect(modal.contentEl.empty).toHaveBeenCalled();
			expect(modal.contentEl.addClass).toHaveBeenCalledWith('insight-engine-loading-modal');

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('h3', {
				text: 'Processing...',
				cls: 'insight-engine-loading-title',
			});

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('div', {
				cls: 'insight-engine-loading-spinner loading-spinner',
			});

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('p', {
				text: testMessage,
				cls: 'insight-engine-loading-message',
			});

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('p', {
				text: 'Insight Engine is analyzing your content. This may take a few moments based on content length.',
				cls: 'insight-engine-loading-info',
			});
		});
	});

	describe('when closing the modal', () => {
		it('should clear the content', () => {
			// When: closing the modal
			modal.onClose();

			// Then: it should empty the content
			expect(modal.contentEl.empty).toHaveBeenCalled();
		});
	});
});
