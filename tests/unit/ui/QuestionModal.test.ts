import { App, Modal, Component, MarkdownRenderer, Notice } from 'obsidian';
import { QuestionModal } from '../../../src/ui/QuestionModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Obsidian's Modal class
vi.mock('obsidian', () => {
	// Create a mock element factory
	const createMockElement = (tag: string, options: any = {}) => {
		const element = {
			style: {},
			className: options.cls || '',
			textContent: options.text || '',
			addEventListener: vi.fn((event, handler) => {
				if (event === 'click') {
					element.clickHandler = handler;
				}
			}),
			createEl: vi.fn().mockImplementation((tag, opts) => {
				const el = createMockElement(tag, opts);
				element.lastCreatedElement = el;
				return el;
			}),
			createDiv: vi.fn().mockImplementation((opts) => {
				const div = createMockElement('div', opts);
				element.lastCreatedElement = div;
				return div;
			}),
			empty: vi.fn(),
			clickHandler: null as any,
			lastCreatedElement: null as any,
			querySelector: vi.fn().mockImplementation((selector) => {
				if (selector === '.copy-button') {
					const button = createMockElement('button', { cls: 'copy-button' });
					return button;
				} else if (selector === '.no-questions-message') {
					return {
						textContent: 'No relevant questions could be generated from this note.',
					};
				}
				return null;
			}),
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
				this.contentEl = createMockElement('div');
				this.close = vi.fn();
			}
		},
		Component: vi.fn(),
		MarkdownRenderer: {
			renderMarkdown: vi.fn().mockResolvedValue(undefined),
		},
		Notice: vi.fn(),
	};
});

// Mock clipboard API
const mockClipboard = {
	writeText: vi.fn().mockResolvedValue(undefined),
};

vi.stubGlobal('navigator', {
	clipboard: mockClipboard,
});

describe('QuestionModal', () => {
	let app: App;
	let component: Component;
	let modal: QuestionModal;
	let questions: string[];

	beforeEach(() => {
		vi.clearAllMocks();
		// Given: an app instance and questions
		app = new App();
		component = new Component();
		questions = ['Question 1', 'Question 2', 'Question 3'];
		modal = new QuestionModal(app, questions, component);

		// Reset clipboard mock
		mockClipboard.writeText.mockClear();
	});

	describe('when opening the modal with questions', () => {
		it('should create all UI elements with correct content', async () => {
			// When: opening the modal
			await modal.onOpen();

			// Then: it should create the necessary elements
			expect(modal.contentEl.empty).toHaveBeenCalled();

			// Check header
			expect(modal.contentEl.createEl).toHaveBeenCalledWith('h2', {
				text: 'Generated Questions',
			});

			// Check questions container
			const questionsContainer = (
				modal.contentEl.createDiv as ReturnType<typeof vi.fn>
			).mock.results.find((call) => call.value.className === 'questions-content')?.value;
			expect(questionsContainer).toBeDefined();

			// Check markdown rendering
			const markdownQuestions = questions.map((q) => `- ${q}`).join('\n');
			expect(MarkdownRenderer.renderMarkdown).toHaveBeenCalledWith(
				markdownQuestions,
				questionsContainer,
				'',
				component
			);

			// Check questions count
			expect(modal.contentEl.createEl).toHaveBeenCalledWith('p', {
				text: '3 questions generated',
				cls: 'questions-count',
			});

			// Check button container and button
			const buttonContainer = (
				modal.contentEl.createDiv as ReturnType<typeof vi.fn>
			).mock.results.find((call) => call.value.className === 'button-container')?.value;
			expect(buttonContainer).toBeDefined();
			expect(buttonContainer.createEl).toHaveBeenCalledWith('button', {
				text: 'Copy to Clipboard',
				cls: ['mod-cta', 'copy-button'],
			});
		});

		it('should handle clipboard copy when button is clicked', async () => {
			// Given: the modal is open
			await modal.onOpen();

			// When: clicking the copy button
			const buttonContainer = (
				modal.contentEl.createDiv as ReturnType<typeof vi.fn>
			).mock.results.find((call) => call.value.className === 'button-container')?.value;
			const button = buttonContainer.lastCreatedElement;
			await button.clickHandler();

			// Then: it should copy to clipboard and show a notice
			const expectedMarkdown = questions.map((q) => `- ${q}`).join('\n');
			expect(mockClipboard.writeText).toHaveBeenCalledWith(expectedMarkdown);
			expect(Notice).toHaveBeenCalledWith('Questions copied to clipboard!');
			expect(modal.close).toHaveBeenCalled();
		});
	});

	describe('when no questions are available', () => {
		beforeEach(() => {
			modal = new QuestionModal(app, [], component);
		});

		it('should show a message indicating the absence of questions', async () => {
			// When: opening the modal
			await modal.onOpen();

			// Then: it should show the no questions message
			const messageDiv = modal.contentEl.querySelector('.no-questions-message');
			expect(messageDiv?.textContent).toBe(
				'No relevant questions could be generated from this note.'
			);
		});
	});

	describe('when closing the modal', () => {
		it('should empty the content element', () => {
			// When: closing the modal
			modal.onClose();

			// Then: it should empty the content
			expect(modal.contentEl.empty).toHaveBeenCalled();
		});
	});
});
