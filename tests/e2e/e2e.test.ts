import { App, TFile, Plugin, PluginManifest, MarkdownView, Command, Editor } from 'obsidian';
import TagAgent from '../../main';
import { TagGenerator } from '../../src/services/tagGenerator';
import { expect, test, describe, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';

describe('TagAgent E2E Tests', () => {
    let app: App;
    let plugin: TagAgent;
    let testNote: TFile;
    
    const manifest: PluginManifest = {
        id: 'obsidian-tag-agent',
        name: 'Tag Agent',
        version: '1.0.0',
        minAppVersion: '0.15.0',
        author: 'Author',
        description: 'AI-powered tag management'
    };

    beforeAll(async () => {
        // Create mock file system
        const mockVault = {
            adapter: {
                read: jest.fn(() => Promise.resolve('# Test Note\ntags: []\nThis is a test note for e2e testing.\n')),
                write: jest.fn(() => Promise.resolve()),
                exists: jest.fn(() => Promise.resolve(true)),
                list: jest.fn(() => Promise.resolve({ files: [], folders: [] })),
                mkdir: jest.fn(() => Promise.resolve()),
                rmdir: jest.fn(() => Promise.resolve()),
                trashSystem: jest.fn(() => Promise.resolve()),
                trashLocal: jest.fn(() => Promise.resolve()),
                copy: jest.fn(() => Promise.resolve()),
                rename: jest.fn(() => Promise.resolve())
            },
            read: jest.fn((file: TFile) => Promise.resolve('# Test Note\ntags: []\nThis is a test note for e2e testing.\n')),
            getAbstractFileByPath: jest.fn().mockReturnValue(testNote)
        } as any;

        // Create test note
        testNote = {
            path: 'note1.md',
            name: 'note1.md',
            basename: 'note1',
            extension: 'md',
            parent: null,
            vault: mockVault,
            stat: {
                ctime: 0,
                mtime: 0,
                size: 0
            }
        } as any;

        // Create mock app with addCommand functionality
        const mockCommands: Command[] = [];
        app = {
            vault: mockVault,
            workspace: {
                getActiveFile: () => testNote,
                on: jest.fn(),
                off: jest.fn(),
                activeEditor: {
                    editor: createMockEditor('')
                }
            },
            loadData: jest.fn(() => Promise.resolve({})),
            saveData: jest.fn(() => Promise.resolve()),
            metadataCache: {
                getFileCache: jest.fn().mockReturnValue({
                    frontmatter: { tags: [] }
                })
            },
            addCommand: jest.fn((command: Command) => {
                mockCommands.push(command);
            }),
            addSettingTab: jest.fn(),
            addRibbonIcon: jest.fn()
        } as any;

        // Initialize plugin
        plugin = new TagAgent(app, manifest);
        await plugin.onload();
        
        // Store commands for testing
        (plugin as any)._commands = mockCommands;
    });

    afterAll((done) => {
        const cleanup = async () => {
            try {
                if (plugin?.onunload) {
                    await plugin.onunload();
                }

                // Clear all mocks and timers
                jest.clearAllMocks();
                jest.clearAllTimers();
                
                // Force clear any remaining handles
                if (typeof process !== 'undefined' && process.listeners) {
                    const listeners = process.listeners('unhandledRejection');
                    listeners.forEach(listener => process.removeListener('unhandledRejection', listener));
                }

                // Force clear all intervals
                for (let i = 0; i < 100000; i++) {
                    clearInterval(i);
                    clearTimeout(i);
                }

                done();
            } catch (error) {
                console.error('Cleanup error:', error);
                done(error);
            }
        };

        cleanup();
    }, 10000);

    const createMockEditor = (content: string): Editor => ({
        getValue: () => content,
        setValue: jest.fn(),
        getCursor: () => ({ line: 0, ch: 0 }),
        getLine: (line: number) => content.split('\n')[line] || '',
        lineCount: () => content.split('\n').length,
        replaceRange: jest.fn(),
        getDoc: jest.fn(),
        refresh: jest.fn(),
        focus: jest.fn(),
        hasFocus: jest.fn(),
        somethingSelected: jest.fn(),
        getSelection: jest.fn(),
        getSelections: jest.fn(),
        replaceSelection: jest.fn(),
        replaceSelections: jest.fn(),
        setCursor: jest.fn(),
        setSelection: jest.fn(),
        setSelections: jest.fn(),
        blur: jest.fn()
    } as unknown as Editor);

    test('should suggest tags for test note content', (done) => {
        (async () => {
            try {
                // Mock fetch for Ollama server check
                const mockFetchResponse = {
                    status: 200,
                    json: () => Promise.resolve({})
                } as Response;
                
                const mockFetch = jest.fn(() => Promise.resolve(mockFetchResponse));
                global.fetch = mockFetch;

                const content = await app.vault.adapter.read('note1.md');
                expect(content).toContain('tags: []');

                // Create mock LLM with proper typing
                const mockTags = ['test', 'sample', 'e2e'];
                const mockLLM = {
                    baseUrl: 'http://localhost:11434',
                    call: jest.fn(() => Promise.resolve(mockTags.join(', ')))
                };

                // Create mock TagGenerator
                const mockTagGenerator = new TagGenerator('http://localhost:11434', 'llama2');
                (mockTagGenerator as any).model = mockLLM;
                (plugin as any).tagGenerator = mockTagGenerator;

                // Create mock editor and view
                const mockEditor = createMockEditor(content);
                const mockView = {
                    file: testNote,
                    editor: mockEditor,
                    getMode: jest.fn(),
                    getViewType: jest.fn(),
                    getState: jest.fn(),
                    setState: jest.fn(),
                    getEphemeralState: jest.fn(),
                    setEphemeralState: jest.fn(),
                    getIcon: jest.fn(),
                    onClose: jest.fn(),
                    onPaneMenu: jest.fn(),
                    onHeaderMenu: jest.fn(),
                    previewMode: false,
                    currentMode: 'source',
                    leaf: {
                        openFile: jest.fn(),
                        setViewState: jest.fn(),
                        getViewState: jest.fn(),
                        setEphemeralState: jest.fn(),
                        getEphemeralState: jest.fn(),
                        togglePin: jest.fn(),
                        setPinned: jest.fn(),
                        setGroupMember: jest.fn(),
                        setGroup: jest.fn(),
                        detach: jest.fn(),
                        attach: jest.fn(),
                        tabHeaderEl: document.createElement('div'),
                        tabHeaderInnerIconEl: document.createElement('div'),
                        view: null,
                        containerEl: document.createElement('div'),
                        working: false,
                        pinned: false,
                        group: null
                    }
                } as unknown as MarkdownView;
                
                // Get the generate tags command
                const pluginCommands = (plugin as any)._commands || [];
                const generateTagsCommand = pluginCommands.find((cmd: Command) => cmd.id === 'generate-note-tags');
                expect(generateTagsCommand).toBeDefined();

                // Call the command's callback
                if (generateTagsCommand?.editorCallback) {
                    await generateTagsCommand.editorCallback(mockEditor, mockView);
                }

                // Verify that the LLM was called
                expect(mockLLM.call).toHaveBeenCalled();
                const calls = mockLLM.call.mock.calls;
                expect(calls.length).toBeGreaterThan(0);
                
                // Type assertion to handle the mock calls array
                const mockCalls = calls as unknown as string[][];
                if (mockCalls.length > 0) {
                    const promptCall = mockCalls[0][0];
                    expect(promptCall).toContain('Content to analyze:');
                    expect(promptCall).toContain(content);
                }

                done();
            } catch (error) {
                done(error);
            }
        })();
    }, 10000);
});
