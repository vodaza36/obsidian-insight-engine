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

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('h3', {
				text: 'Processing...',
				attr: expect.objectContaining({
					style: expect.stringContaining('margin: 0 0 10px 0'),
				}),
			});

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('div', {
				cls: 'loading-spinner',
				attr: expect.objectContaining({
					style: expect.stringContaining('margin: 0 auto 10px auto'),
				}),
			});

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('p', {
				text: testMessage,
				attr: expect.objectContaining({
					style: expect.stringContaining('margin-bottom: 10px'),
				}),
			});

			expect(modal.contentEl.createEl).toHaveBeenCalledWith('p', {
				text: 'Insight Engine is analyzing your content. This may take a few moments based on content length.',
				attr: expect.objectContaining({
					style: expect.stringContaining('margin-bottom: 10px'),
				}),
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
