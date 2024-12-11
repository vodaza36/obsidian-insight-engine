import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TFile, MarkdownView, getAllTags, Notice, PluginManifest } from 'obsidian';
import { TagGenerator } from '../../../src/services/tagGenerator';
import { NoteSummaryService } from '../../../src/services/noteSummary';
import { QuestionGenerator } from '../../../src/services/questionGenerator';
import { DEFAULT_SETTINGS } from '../../../src/models/types';
import { LLMFactory } from '../../../src/services/llmFactory';
import InsightEngine from '../../../src/core/InsightEngine';

// Mock UI components
vi.mock('../../../src/ui/TagSuggestionModal', () => {
	const MockModal = vi.fn();
	MockModal.prototype.open = vi.fn();
	MockModal.prototype.close = vi.fn();
	return { TagSuggestionModal: MockModal };
});

vi.mock('../../../src/ui/LoadingModal', () => {
	const MockModal = vi.fn();
	MockModal.prototype.open = vi.fn();
	MockModal.prototype.close = vi.fn();
	return { LoadingModal: MockModal };
});

vi.mock('../../../src/ui/SummaryModal', () => {
	const MockModal = vi.fn();
	MockModal.prototype.open = vi.fn();
	MockModal.prototype.close = vi.fn();
	return { SummaryModal: MockModal };
});

vi.mock('../../../src/ui/QuestionModal', () => {
	const MockModal = vi.fn();
	MockModal.prototype.open = vi.fn();
	MockModal.prototype.close = vi.fn();
	return { QuestionModal: MockModal };
});

// Mock types module
vi.mock('../../../src/models/types', () => {
	return {
		DEFAULT_SETTINGS: {
			llmProvider: 'ollama',
			modelName: 'llama2',
			tagFormat: 'property',
		},
		LLMProvider: {
			OLLAMA: 'ollama',
			OPENAI: 'openai',
		},
	};
});

// Mock Obsidian modules
vi.mock('obsidian', () => {
	const mockVault = {
		getMarkdownFiles: vi.fn().mockReturnValue([]),
		read: vi.fn(),
		modify: vi.fn(),
	};

	const mockMetadataCache = {
		getFileCache: vi.fn(),
		getTags: vi.fn(),
	};

	return {
		Plugin: class Plugin {
			app: any;
			constructor(app: any) {
				this.app = app;
			}
			loadData: () => Promise<any> = vi.fn().mockResolvedValue({});
			saveData: (data: any) => Promise<void> = vi.fn();
			addCommand: (command: any) => void = vi.fn();
			addSettingTab: (tab: any) => void = vi.fn();
		},
		App: vi.fn().mockImplementation(() => ({
			vault: mockVault,
			metadataCache: mockMetadataCache,
		})),
		MarkdownView: vi.fn(),
		TFile: vi.fn(),
		getAllTags: vi.fn(),
		Notice: vi.fn(),
	};
});

// Mock LLMFactory
vi.mock('../../../src/services/llmFactory', () => {
	const actual = vi.importActual('../../../src/services/llmFactory') as any;
	return {
		...actual,
		LLMFactory: {
			validateConfig: vi.fn().mockReturnValue(null),
			createModel: vi.fn().mockReturnValue({}),
		},
	};
});

// Mock UI components with proper open/close methods
const createModalMock = () => {
	function MockModal(app: any, message?: string) {
		this.app = app;
		this.message = message;
	}
	MockModal.prototype.open = vi.fn();
	MockModal.prototype.close = vi.fn();
	return MockModal;
};

// Mock modal classes
const MockLoadingModal = createModalMock();
const MockTagSuggestionModal = createModalMock();
const MockSummaryModal = createModalMock();
const MockQuestionModal = createModalMock();

vi.mock('../../../src/ui/SettingsTab', () => ({
	InsightEngineSettingTab: vi.fn(),
}));

describe('InsightEngine', () => {
	let engine: InsightEngine;
	let mockApp: any;
	let mockFile: TFile;
	let mockTagGenerator: TagGenerator & { suggestTags: ReturnType<typeof vi.fn> };
	let mockNoteSummaryService: NoteSummaryService;
	let mockQuestionGenerator: QuestionGenerator;
	let mockWorkspace: any;
	let mockVault: any;
	let mockMetadataCache: any;
	let mockManifest: PluginManifest;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock manifest
		mockManifest = {
			id: 'test-plugin',
			name: 'Test Plugin',
			version: '1.0.0',
			minAppVersion: '0.15.0',
			author: 'Test Author',
			authorUrl: 'https://test.com',
			description: 'Test plugin',
		};

		// Create mock app and its components
		mockWorkspace = {
			getActiveViewOfType: vi.fn(),
		};

		mockVault = {
			read: vi.fn().mockResolvedValue('test content'),
			getMarkdownFiles: vi.fn().mockReturnValue([]),
			modify: vi.fn().mockResolvedValue(undefined),
		};

		mockMetadataCache = {
			getFileCache: vi.fn().mockReturnValue({
				tags: [],
			}),
		};

		mockApp = {
			vault: mockVault,
			workspace: mockWorkspace,
			metadataCache: mockMetadataCache,
			manifest: mockManifest,
			loadData: () => Promise.resolve({}),
			saveData: vi.fn(),
			addCommand: vi.fn(),
			addSettingTab: vi.fn(),
		};

		// Create mock file
		mockFile = new TFile();
		mockFile.path = 'test.md';
		mockFile.basename = 'test';
		mockFile.extension = 'md';

		// Create mock services
		mockTagGenerator = {
			suggestTags: vi.fn().mockResolvedValue(['tag1', 'tag2']),
		} as TagGenerator & { suggestTags: ReturnType<typeof vi.fn> };

		mockNoteSummaryService = {
			generateSummary: vi.fn().mockResolvedValue({ summary: 'Summary' }),
		} as unknown as NoteSummaryService;

		mockQuestionGenerator = {
			generateQuestions: vi.fn().mockResolvedValue(['Question 1', 'Question 2']),
			promptTemplate: '',
			outputParser: {} as any,
			model: {} as any,
			llmConfig: {} as any,
			systemPrompt: '',
			maxTokens: 100,
		} as unknown as QuestionGenerator;

		// Mock getAllTags function
		(getAllTags as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['#existing']);

		// Initialize engine with mock manifest
		engine = new InsightEngine(mockApp, mockManifest);
		engine.tagGenerator = mockTagGenerator;
		engine.settings = { ...DEFAULT_SETTINGS };

		// Make private methods accessible for testing
		Object.assign(engine, {
			getAllVaultTags: engine.getAllVaultTags,
			summarizeNote: engine.summarizeNote,
			generateQuestionsForNote: engine.generateQuestionsForNote,
			initializeServices: engine.initializeServices,
			generateTagsForNote: engine.generateTagsForNote,
			appendTagsToNote: engine.appendTagsToNote,
			handleLLMError: engine.handleLLMError,
		});
	});

	describe('initialization', () => {
		it('should load settings on initialization', async () => {
			await engine.loadSettings();
			expect(engine.settings).toEqual(DEFAULT_SETTINGS);
		});

		it('should initialize services with valid configuration', () => {
			(engine as any).initializeServices();
			expect(LLMFactory.validateConfig).toHaveBeenCalledWith(
				engine.settings.llmProvider,
				engine.settings
			);
			expect(LLMFactory.createModel).toHaveBeenCalled();
		});
	});

	describe('tag management', () => {
		beforeEach(() => {
			engine.tagGenerator = mockTagGenerator;
		});

		it('should get all vault tags', async () => {
			mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
			mockMetadataCache.getFileCache.mockReturnValue({
				tags: [{ tag: '#test' }, { tag: '#example' }],
			});

			const tags = await (engine as any).getAllVaultTags();
			expect(tags.size).toBe(2);
			expect(tags.has('test')).toBe(true);
			expect(tags.has('example')).toBe(true);
		});

		it('should generate tags for a note', async () => {
			const mockActiveView = { file: mockFile } as MarkdownView;
			mockWorkspace.getActiveViewOfType.mockReturnValue(mockActiveView);

			// Mock getAllVaultTags
			mockVault.getMarkdownFiles.mockReturnValue([mockFile]);
			mockMetadataCache.getFileCache.mockReturnValue({
				tags: [{ tag: '#test' }, { tag: '#example' }],
			});

			await engine.generateTagsForNote(mockFile);

			expect(mockVault.read).toHaveBeenCalledWith(mockFile);
			expect(mockTagGenerator.suggestTags).toHaveBeenCalled();
		});
	});

	describe('note operations', () => {
		beforeEach(() => {
			engine.noteSummaryService = mockNoteSummaryService;
			engine.questionGenerator = mockQuestionGenerator;
		});

		it('should generate summary for a note', async () => {
			const mockActiveView = { file: mockFile } as MarkdownView;
			mockWorkspace.getActiveViewOfType.mockReturnValue(mockActiveView);

			await (engine as any).summarizeNote(mockFile);

			expect(mockVault.read).toHaveBeenCalledWith(mockFile);
			expect(mockNoteSummaryService.generateSummary).toHaveBeenCalledWith('test content');
		});

		it('should generate questions for a note', async () => {
			const mockActiveView = { file: mockFile } as MarkdownView;
			mockWorkspace.getActiveViewOfType.mockReturnValue(mockActiveView);

			await (engine as any).generateQuestionsForNote(mockFile);

			expect(mockVault.read).toHaveBeenCalledWith(mockFile);
			expect(mockQuestionGenerator.generateQuestions).toHaveBeenCalledWith('test content');
		});
	});

	describe('error handling', () => {
		it('should handle service initialization failure', () => {
			engine = new InsightEngine(mockApp, mockManifest);
			engine.settings = { ...DEFAULT_SETTINGS };
			LLMFactory.validateConfig = vi.fn().mockReturnValue('Configuration error');

			(engine as any).initializeServices();

			expect(Notice).toHaveBeenCalledWith('Configuration error');
		});

		it('should handle LLM operation errors', async () => {
			const error = new Error('Ollama server is not running');
			mockTagGenerator.suggestTags.mockRejectedValueOnce(error);

			await engine.generateTagsForNote(mockFile);

			expect(Notice).toHaveBeenCalledWith(
				'Error: Ollama server is not running. Please start it using the command: "ollama serve"',
				10000
			);
		});

		it('should handle general operation errors', async () => {
			const error = new Error('General error');
			mockTagGenerator.suggestTags.mockRejectedValueOnce(error);

			await engine.generateTagsForNote(mockFile);

			expect(Notice).toHaveBeenCalledWith(
				'Operation failed. Please check the console for details.'
			);
		});
	});

	describe('tag modification', () => {
		beforeEach(() => {
			mockVault.modify.mockReset();
		});

		describe('frontmatter format', () => {
			beforeEach(() => {
				engine.settings.tagFormat = 'property';
			});

			it('should append tags to note', async () => {
				const content = '---\ntags: \n  - existing\n---\nContent';
				mockVault.read.mockResolvedValueOnce(content);

				await (engine as any).appendTagsToNote(mockFile, ['newtag'], []);

				expect(mockVault.modify).toHaveBeenCalledWith(
					mockFile,
					expect.stringContaining('tags:\n  - existing\n  - newtag')
				);
			});

			it('should remove tags from note', async () => {
				const content = '---\ntags: [tag1, tag2, tag3]\n---\nContent';
				mockVault.read.mockResolvedValueOnce(content);

				await (engine as any).appendTagsToNote(mockFile, [], ['tag2']);

				expect(mockVault.modify).toHaveBeenCalledWith(
					mockFile,
					expect.stringContaining('tags:\n  - tag1\n  - tag3')
				);
			});

			it('should create frontmatter when none exists', async () => {
				const content = 'Just content without frontmatter';
				mockVault.read.mockResolvedValueOnce(content);

				await (engine as any).appendTagsToNote(mockFile, ['newtag'], []);

				const expectedContent =
					'---\ntags:\n  - newtag\n---\nJust content without frontmatter';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
			});

			it('should add a new tag to existing frontmatter tags', async () => {
				const content = '---\ntags:\n  - ai\n  - garden\nauthor: max\n---\nContent';
				mockVault.read.mockResolvedValueOnce(content);

				await (engine as any).appendTagsToNote(mockFile, ['llm'], []);

				expect(mockVault.modify).toHaveBeenCalledWith(
					mockFile,
					expect.stringMatching(/tags:[\s\n]+-\s+ai[\s\n]+-\s+garden[\s\n]+-\s+llm/)
				);
				expect(mockVault.modify).toHaveBeenCalledWith(
					mockFile,
					expect.stringContaining('author: max')
				);
			});
		});

		describe('inline format', () => {
			beforeEach(() => {
				engine.settings.tagFormat = 'line';
			});

			it('should append tags at top location with proper newline', async () => {
				const content = 'Content\n#tag1 #tag2';
				mockVault.read.mockResolvedValueOnce(content);
				engine.settings.tagLocation = 'top';

				await (engine as any).appendTagsToNote(mockFile, ['tag3'], ['tag1']);

				const modifiedContent = '#tag2 #tag3\n\nContent';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, modifiedContent);
			});

			it('should append tags at bottom location with proper newlines', async () => {
				const content = '#tag1 #tag2\nContent';
				mockVault.read.mockResolvedValueOnce(content);
				engine.settings.tagLocation = 'bottom';

				await (engine as any).appendTagsToNote(mockFile, ['tag3'], ['tag1']);

				const modifiedContent = 'Content\n\n#tag2 #tag3';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, modifiedContent);
			});

			it('should add new tags at top when no tags exist', async () => {
				const content = 'Just content without tags';
				mockVault.read.mockResolvedValueOnce(content);
				engine.settings.tagLocation = 'top';

				await (engine as any).appendTagsToNote(mockFile, ['newtag'], []);

				const expectedContent = '#newtag\n\nJust content without tags';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
			});

			it('should add new tags at bottom when no tags exist', async () => {
				const content = 'Just content without tags';
				mockVault.read.mockResolvedValueOnce(content);
				engine.settings.tagLocation = 'bottom';

				await (engine as any).appendTagsToNote(mockFile, ['newtag'], []);

				const expectedContent = 'Just content without tags\n\n#newtag';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
			});

			it('should handle empty content with top location', async () => {
				const content = '';
				mockVault.read.mockResolvedValueOnce(content);
				engine.settings.tagLocation = 'top';

				await (engine as any).appendTagsToNote(mockFile, ['newtag'], []);

				const expectedContent = '#newtag\n\n';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
			});

			it('should handle empty content with bottom location', async () => {
				const content = '';
				mockVault.read.mockResolvedValueOnce(content);
				engine.settings.tagLocation = 'bottom';

				await (engine as any).appendTagsToNote(mockFile, ['newtag'], []);

				const expectedContent = '#newtag';
				expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expectedContent);
			});
		});
	});

	describe('command registration', () => {
		beforeEach(() => {
			(engine.addCommand as ReturnType<typeof vi.fn>).mockReset();
			(Notice as ReturnType<typeof vi.fn>).mockReset();
		});

		it('should register all commands on load', async () => {
			await engine.onload();

			expect(engine.addCommand).toHaveBeenCalledTimes(3); // tag, summary, and question commands
		});

		it('should handle command execution when services are not initialized', async () => {
			// Reset mocks
			(Notice as ReturnType<typeof vi.fn>).mockReset();
			(engine.addCommand as ReturnType<typeof vi.fn>).mockReset();

			// Mock LLMFactory to simulate initialization failure
			(LLMFactory.createModel as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

			// Mock active view
			const mockActiveView = { file: mockFile } as MarkdownView;
			mockWorkspace.getActiveViewOfType.mockReturnValue(mockActiveView);

			// Mock command registration to execute the callback immediately
			(engine.addCommand as ReturnType<typeof vi.fn>).mockImplementation((command) => {
				if (command.checkCallback) {
					// First call with checking=true to verify the command is available
					if (command.checkCallback(true)) {
						// Then call with checking=false to execute the command
						command.checkCallback(false);
					}
				}
			});

			await engine.onload();

			// Verify that Notice was called for uninitialized services
			// Since we register 3 commands and each will show the notice, it should be called 3 times
			expect(Notice).toHaveBeenCalledWith('Please configure the LLM settings first.');
			expect(Notice).toHaveBeenCalledTimes(3);
		});
	});

	describe('tag formatting and manipulation', () => {
		beforeEach(() => {
			mockVault.modify.mockReset();
			engine.settings.tagFormat = 'property';
		});

		it('should format tags consistently', () => {
			expect((engine as any).formatTag('tag')).toBe('#tag');
			expect((engine as any).formatTag('#tag')).toBe('#tag');
		});

		it('should handle empty tag lists', async () => {
			const content = '---\ntags: []\n---\nContent';
			mockVault.read.mockResolvedValueOnce(content);
			const file = new TFile();
			file.path = 'test.md';
			file.basename = 'test';
			file.extension = 'md';
			await engine.generateTagsForNote(file);
			expect(mockTagGenerator.suggestTags).toHaveBeenCalled();
		});

		it('should handle duplicate tags case-insensitively', async () => {
			const content = '---\ntags: [Tag1]\n---\nContent';
			mockVault.read.mockResolvedValueOnce(content);

			await (engine as any).appendTagsToNote(mockFile, ['tag1', 'TAG1'], []);

			expect(mockVault.modify).not.toHaveBeenCalled();
		});

		it('should handle tag format in frontmatter', async () => {
			engine.settings.tagFormat = 'property';
			const content = '---\ntags: \n  - test\n  - example\n---\nContent';
			mockVault.read.mockResolvedValueOnce(content);
			const file = new TFile();
			file.path = 'test.md';
			file.basename = 'test';
			file.extension = 'md';
			await engine.generateTagsForNote(file);
			expect(mockTagGenerator.suggestTags).toHaveBeenCalled();
		});

		it('should handle inline tag format', async () => {
			engine.settings.tagFormat = 'line';
			const content = '# Title\n#test #example\nContent';
			mockVault.read.mockResolvedValueOnce(content);
			const file = new TFile();
			file.path = 'test.md';
			file.basename = 'test';
			file.extension = 'md';
			await engine.generateTagsForNote(file);
			expect(mockTagGenerator.suggestTags).toHaveBeenCalled();
		});
	});

	describe('error handling and loading modal', () => {
		it('should handle Ollama server error', () => {
			const error = new Error('Ollama server is not running');
			const mockLoadingModal = { close: vi.fn() };

			(engine as any).handleLLMError(error, mockLoadingModal);

			expect(mockLoadingModal.close).toHaveBeenCalled();
			expect(Notice).toHaveBeenCalledWith(
				expect.stringContaining('Ollama server is not running'),
				10000
			);
		});

		it('should handle general errors', () => {
			const error = new Error('General error');
			const mockLoadingModal = { close: vi.fn() };

			(engine as any).handleLLMError(error, mockLoadingModal);

			expect(mockLoadingModal.close).toHaveBeenCalled();
			expect(Notice).toHaveBeenCalledWith(
				'Operation failed. Please check the console for details.'
			);
		});

		it('should handle operation with loading modal success', async () => {
			const operation = vi.fn().mockResolvedValue('result');

			const result = await (engine as any).withLoadingModal('Loading...', operation);

			expect(result).toBe('result');
		});

		it('should handle operation with loading modal failure', async () => {
			const error = new Error('Operation failed');
			const operation = vi.fn().mockRejectedValue(error);

			const result = await (engine as any).withLoadingModal('Loading...', operation);

			expect(result).toBeUndefined();
		});
	});
});
