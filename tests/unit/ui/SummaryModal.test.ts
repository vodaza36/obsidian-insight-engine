import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App, Component, MarkdownRenderer } from 'obsidian';
import { SummaryModal } from '../../../src/ui/SummaryModal';

// Mock Obsidian's Modal class and other components
const mockModule = {
	onClickCallback: null as Function | null,
	__getLastOnClick: function () {
		return this.onClickCallback;
	},
};

vi.mock('obsidian', () => {
	const createMockElement = () => {
		const element = {
			createEl: vi.fn().mockReturnThis(),
			createDiv: vi.fn().mockReturnThis(),
			empty: vi.fn(),
		};
		return element;
	};

	return {
		App: vi.fn(),
		Modal: class MockModal {
			app: any;
			contentEl: any;
			close: any;

			constructor(app: any) {
				this.app = app;
				this.contentEl = createMockElement();
				this.close = vi.fn();
			}
		},
		Setting: class MockSetting {
			constructor(containerEl: any) {}
			addButton(cb: any) {
				const button = {
					setButtonText: vi.fn().mockReturnThis(),
					setCta: vi.fn().mockReturnThis(),
					onClick: vi.fn((clickCb) => {
						mockModule.onClickCallback = clickCb;
						return button;
					}),
				};
				cb(button);
				return this;
			}
		},
		Component: vi.fn(),
		MarkdownRenderer: {
			renderMarkdown: vi.fn().mockResolvedValue(undefined),
		},
	};
});

describe('SummaryModal', () => {
	let app: App;
	let component: Component;
	let modal: SummaryModal;
	const testSummary = 'Test Summary Content';

	beforeEach(() => {
		app = new App();
		component = new Component();
		mockModule.onClickCallback = null;

		// Mock clipboard API
		Object.assign(navigator, {
			clipboard: {
				writeText: vi.fn().mockResolvedValue(undefined),
			},
		});

		modal = new SummaryModal(app, testSummary, component);
		vi.clearAllMocks();
	});

	describe('when opening the modal', () => {
		it('should create a header with correct text and class', async () => {
			await modal.onOpen();
			expect(modal.contentEl.createEl).toHaveBeenCalledWith('h2', {
				text: 'Note Summary',
				cls: 'summary-modal-title',
			});
		});

		it('should create container divs with correct classes', async () => {
			await modal.onOpen();
			expect(modal.contentEl.createDiv).toHaveBeenCalledWith({
				cls: 'summary-modal-content',
			});
			expect(modal.contentEl.createDiv).toHaveBeenCalledWith({
				cls: 'summary-modal-text',
			});
			expect(modal.contentEl.createDiv).toHaveBeenCalledWith({
				cls: 'summary-modal-button-container',
			});
		});

		it('should render the summary content using MarkdownRenderer', async () => {
			await modal.onOpen();
			const { renderMarkdown } = MarkdownRenderer;
			expect(renderMarkdown).toHaveBeenCalledWith(
				testSummary,
				expect.anything(),
				'',
				component
			);
		});

		it('should add styles to the modal', async () => {
			await modal.onOpen();
			expect(modal.contentEl.createEl).toHaveBeenCalledWith('style', {
				text: expect.stringContaining('summary-modal-title'),
			});
		});

		it('should create a copy to clipboard button that copies the summary', async () => {
			await modal.onOpen();
			const onClick = mockModule.__getLastOnClick();
			await onClick();
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testSummary);
			expect(modal.close).toHaveBeenCalled();
		});
	});

	describe('when closing the modal', () => {
		it('should clear all content', () => {
			modal.onClose();
			expect(modal.contentEl.empty).toHaveBeenCalled();
		});
	});
});
