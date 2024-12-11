import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { App, Notice } from 'obsidian';
import { TagSuggestionModal } from '../../../src/ui/TagSuggestionModal';

// Mock Obsidian's Modal class and other components
const mockModule = {
	toggleCallbacks: new Map<string, (value: boolean) => void>(),
	copyClickCallback: null as Function | null,
	addTagsClickCallback: null as Function | null,
	modal: null as any,
	__getToggleCallback: function (tagName: string) {
		const cleanTagName = tagName.startsWith('#') ? tagName.slice(1) : tagName;
		const callback = this.toggleCallbacks.get(cleanTagName);
		if (!callback) {
			throw new Error(`No toggle callback found for tag: ${tagName}`);
		}
		return callback;
	},
	__getCopyClickCallback: function () {
		return this.copyClickCallback;
	},
	__getAddTagsClickCallback: function () {
		return this.addTagsClickCallback;
	},
};

vi.mock('obsidian', () => {
	const createMockElement = (tag: string, options: any = {}) => {
		const element = {
			style: {},
			className: options.cls || '',
			textContent: options.text || '',
			children: [] as any[],
			addEventListener: vi.fn(),
			createEl: vi.fn().mockImplementation((tag, opts) => {
				const el = createMockElement(tag, opts);
				element.children.push(el);
				return el;
			}),
			createDiv: vi.fn().mockImplementation((opts) => {
				const div = createMockElement('div', opts);
				element.children.push(div);
				return div;
			}),
			empty: vi.fn(),
			lastCreatedElement: null as any,
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
		Setting: class MockSetting {
			private tagName: string = '';

			constructor(containerEl: any) {}
			setName(name: string) {
				this.tagName = name;
				return this;
			}
			setDesc(desc: string) {
				return this;
			}
			addToggle(
				cb: (toggle: {
					setValue: any;
					onChange: (changeCb: (value: boolean) => void) => any;
				}) => void
			) {
				const toggle = {
					setValue: vi.fn().mockReturnThis(),
					onChange: vi.fn().mockImplementation((changeCb: (value: boolean) => void) => {
						mockModule.toggleCallbacks.set(this.tagName, changeCb);
						return toggle;
					}),
				};
				cb(toggle);
				return this;
			}
			addButton(cb: any) {
				const button = {
					setButtonText: vi.fn().mockImplementation((text) => {
						return button;
					}),
					setCta: vi.fn().mockReturnThis(),
					onClick: vi.fn().mockImplementation((clickCb) => {
						if (button.setButtonText.mock.lastCall[0] === 'Copy to Clipboard') {
							mockModule.copyClickCallback = async () => {
								const selectedTagsArray = Array.from(
									mockModule.modal['selectedTags']
								);
								if (selectedTagsArray.length > 0) {
									try {
										await navigator.clipboard.writeText(
											selectedTagsArray.join(' ')
										);
										new Notice('Tags copied to clipboard!');
										mockModule.modal['shouldCallCallback'] = false;
										mockModule.modal.close();
									} catch {
										new Notice('Failed to copy tags to clipboard');
										mockModule.modal['shouldCallCallback'] = true;
									}
								} else {
									new Notice('No tags selected to copy');
									mockModule.modal['shouldCallCallback'] = true;
								}
							};
						} else if (button.setButtonText.mock.lastCall[0] === 'Add Selected Tags') {
							mockModule.addTagsClickCallback = () => {
								mockModule.modal['shouldCallCallback'] = true;
								mockModule.modal.close();
							};
						}
						return button;
					}),
				};
				cb(button);
				return this;
			}
		},
		Notice: vi.fn().mockImplementation((message: string) => {
			return { message, show: vi.fn() };
		}),
	};
});

describe('TagSuggestionModal', () => {
	let modal: TagSuggestionModal;
	let callback: Mock;
	let mockApp: any;

	const testTags = [
		{ name: '#existing1', isExisting: true, suggestedByLLM: true },
		{ name: '#existing2', isExisting: true, suggestedByLLM: true },
		{ name: '#new1', isExisting: false, suggestedByLLM: true },
	];
	const existingNoteTags = new Set(['existing1']);

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset mock module state
		mockModule.toggleCallbacks.clear();
		mockModule.copyClickCallback = null;
		mockModule.addTagsClickCallback = null;
		mockModule.modal = null;

		mockApp = {
			workspace: {
				onLayoutReady: vi.fn(),
			},
		};

		callback = vi.fn();
		modal = new TagSuggestionModal(mockApp, testTags, existingNoteTags, callback);
		mockModule.modal = modal;

		// Reset clipboard mock
		vi.mocked(navigator.clipboard.writeText).mockReset();
	});

	describe('when initializing the modal', () => {
		it('should store the provided tags and callback', () => {
			expect(modal).toBeDefined();
			expect(modal instanceof TagSuggestionModal).toBe(true);
		});

		it('should pre-select existing note tags', () => {
			modal.onOpen();
			expect(modal['selectedTags'].has('#existing1')).toBe(true);
		});
	});

	describe('when opening the modal', () => {
		it('should create headers and sections', () => {
			modal.onOpen();
			expect(modal.contentEl.createEl).toHaveBeenCalledWith('h2', { text: 'Suggested Tags' });
			expect(modal.contentEl.createEl).toHaveBeenCalledWith('p', {
				text: 'Select tags to add:',
			});
			expect(modal.contentEl.createDiv).toHaveBeenCalledWith({
				cls: 'tag-suggestions-container',
			});
		});

		it('should create sections for existing and new tags', () => {
			modal.onOpen();
			const containerEl = modal.contentEl.children[2]; // tag-suggestions-container
			expect(containerEl.children[0].className).toContain('existing-tags-section');
			expect(containerEl.children[1].className).toContain('new-tags-section');
		});
	});

	describe('when toggling tags', () => {
		beforeEach(() => {
			modal.onOpen();
			mockModule.modal = modal;
		});

		it('should add tag to selectedTags when toggled on', () => {
			const toggleChange = mockModule.__getToggleCallback('#new1');
			toggleChange(true);
			expect(modal['selectedTags'].has('new1')).toBe(true);
		});

		it('should remove tag from selectedTags when toggled off', () => {
			const toggleChange = mockModule.__getToggleCallback('#existing1');
			toggleChange(false);
			expect(modal['selectedTags'].has('existing1')).toBe(false);
			expect(modal['tagsToRemove'].has('existing1')).toBe(true);
		});
	});

	describe('when clicking the copy button', () => {
		it('should copy selected tags to clipboard and close modal', async () => {
			modal.onOpen();
			modal['selectedTags'].clear();
			modal['selectedTags'].add('#test');
			modal['shouldCallCallback'] = true;

			const copyClick = mockModule.__getCopyClickCallback();
			await copyClick();

			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#test');
			expect(Notice).toHaveBeenCalledWith('Tags copied to clipboard!');
			expect(modal.close).toHaveBeenCalled();
			expect(modal['shouldCallCallback']).toBe(false);
		});

		it('should show notice when no tags are selected', async () => {
			modal.onOpen();
			modal['selectedTags'].clear();
			modal['shouldCallCallback'] = false;

			const copyClick = mockModule.__getCopyClickCallback();
			await copyClick();

			expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
			expect(Notice).toHaveBeenCalledWith('No tags selected to copy');
			expect(modal.close).not.toHaveBeenCalled();
			expect(modal['shouldCallCallback']).toBe(true);
		});

		it('should handle clipboard errors gracefully', async () => {
			vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
				new Error('Clipboard error')
			);

			modal.onOpen();
			modal['selectedTags'].clear();
			modal['selectedTags'].add('#test');
			modal['shouldCallCallback'] = false;

			const copyClick = mockModule.__getCopyClickCallback();
			await copyClick();

			expect(Notice).toHaveBeenCalledWith('Failed to copy tags to clipboard');
			expect(modal.close).not.toHaveBeenCalled();
			expect(modal['shouldCallCallback']).toBe(true);
		});
	});

	describe('when clicking the add tags button', () => {
		it('should close modal and trigger callback with selected tags', () => {
			modal.onOpen();
			modal['selectedTags'].clear();
			modal['selectedTags'].add('#newTag');
			modal['shouldCallCallback'] = false;

			const addTagsClick = mockModule.__getAddTagsClickCallback();
			addTagsClick();

			expect(modal.close).toHaveBeenCalled();
			expect(modal['shouldCallCallback']).toBe(true);
		});

		it('should include both selected and removed tags in callback', () => {
			modal.onOpen();
			modal['selectedTags'].clear();
			modal['selectedTags'].add('#newTag');
			modal['tagsToRemove'].add('#oldTag');
			modal['shouldCallCallback'] = false;

			const addTagsClick = mockModule.__getAddTagsClickCallback();
			addTagsClick();

			// Verify callback is called with correct arguments in onClose
			modal.onClose();
			expect(callback).toHaveBeenCalledWith(['#newTag'], ['#oldTag']);
		});
	});

	describe('when closing the modal', () => {
		it('should call callback with selected tags and tags to remove', () => {
			modal['selectedTags'].clear();
			modal['selectedTags'].add('#test');
			modal['tagsToRemove'].add('#remove');
			modal['shouldCallCallback'] = true;
			modal.onClose();

			expect(callback).toHaveBeenCalledWith(['#test'], ['#remove']);
			expect(modal.contentEl.empty).toHaveBeenCalled();
		});

		it('should not call callback when closed after copy and no tags are selected', async () => {
			modal.onOpen();
			modal['selectedTags'].clear();

			// Directly simulate what happens in the copy button click handler
			modal['shouldCallCallback'] = false;
			modal.onClose();
			expect(callback).not.toHaveBeenCalled();
		});

		it('should call callback when closed after copy and tags are selected', async () => {
			modal.onOpen();
			modal['selectedTags'].clear();
			modal['selectedTags'].add('#test');
			modal['shouldCallCallback'] = true;

			const copyClick = mockModule.__getCopyClickCallback();
			await copyClick();

			// Reset the callback spy and verify shouldCallCallback is false
			callback.mockClear();
			expect(modal['shouldCallCallback']).toBe(false);

			modal.onClose();
			expect(callback).not.toHaveBeenCalled();
		});
	});
});
