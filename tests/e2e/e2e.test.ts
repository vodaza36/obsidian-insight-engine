import { App, TFile, Vault, Plugin, Command, Editor, MarkdownView } from 'obsidian';
import TagAgent from '../../main';
import { expect, test, describe, beforeAll, afterAll, jest } from '@jest/globals';
import { join } from 'path';
import * as fs from 'fs';

const TEST_VAULT_PATH = join(__dirname, 'test-vault');

// Create mock TFile factory
const createMockTFile = (filepath: string, vault: Vault): TFile => {
    const stats = fs.statSync(join(TEST_VAULT_PATH, filepath));
    return {
        path: filepath,
        name: filepath,
        basename: filepath.split('.')[0],
        extension: filepath.split('.').pop() || '',
        parent: null,
        vault,
        stat: {
            ctime: stats.ctimeMs,
            mtime: stats.mtimeMs,
            size: stats.size
        }
    } as unknown as TFile;
};

// Create mock Editor factory
const createMockEditor = (content: string): Editor => {
    return {
        getValue: () => content,
        setValue: jest.fn(),
        getDoc: jest.fn(),
        refresh: jest.fn(),
        getLine: jest.fn(),
        setLine: jest.fn(),
        lineCount: jest.fn(() => 1),
        lastLine: jest.fn(() => 0),
        getRange: jest.fn(),
        replaceRange: jest.fn(),
        getSelection: jest.fn(),
        somethingSelected: jest.fn(),
        getSelections: jest.fn(),
        replaceSelection: jest.fn(),
        replaceSelections: jest.fn(),
        getCursor: jest.fn(),
        listSelections: jest.fn(),
        setCursor: jest.fn(),
        setSelection: jest.fn(),
        setSelections: jest.fn(),
        focus: jest.fn(),
        hasFocus: jest.fn(),
        blur: jest.fn(),
        getScrollInfo: jest.fn(),
        scrollTo: jest.fn(),
        scrollIntoView: jest.fn(),
        undo: jest.fn(),
        redo: jest.fn(),
        exec: jest.fn(),
        transaction: jest.fn(),
        posToOffset: jest.fn(),
        offsetToPos: jest.fn(),
        processLines: jest.fn(),
        wordAt: jest.fn(() => null)
    } as unknown as Editor;
};

describe('TagAgent E2E Tests', () => {
    let app: App;
    let plugin: TagAgent;
    let testNote: TFile;
    let mockVault: Vault;
    let registeredCommands: Command[] = [];

    beforeAll(async () => {
        // Create mock vault
        mockVault = {
            adapter: {
                read: async (path: string) => fs.readFileSync(join(TEST_VAULT_PATH, path), 'utf8'),
                write: async (path: string, data: string) => 
                    fs.writeFileSync(join(TEST_VAULT_PATH, path), data, 'utf8'),
                exists: async (path: string) => 
                    fs.existsSync(join(TEST_VAULT_PATH, path)),
                list: async (normalizedPath: string) => {
                    const files = fs.readdirSync(TEST_VAULT_PATH);
                    return {
                        files: files.map(f => f),
                        folders: []
                    };
                }
            },
            getFiles: () => {
                const files = fs.readdirSync(TEST_VAULT_PATH);
                return files.map(f => createMockTFile(f, mockVault));
            },
            read: async (file: TFile) => fs.readFileSync(join(TEST_VAULT_PATH, file.path), 'utf8')
        } as unknown as Vault;

        // Create mock app with required Plugin methods
        app = {
            vault: mockVault,
            workspace: {
                getActiveFile: () => testNote,
                on: jest.fn(),
                off: jest.fn()
            }
        } as unknown as App;

        // Initialize plugin with mocked methods
        plugin = new TagAgent(app, {
            id: 'tag-agent',
            name: 'Tag Agent',
            version: '1.0.0',
            minAppVersion: '0.15.0',
            author: 'Author',
            description: 'AI-powered tag management'
        });

        // Mock plugin methods
        Object.assign(plugin, {
            addSettingTab: jest.fn(),
            addCommand: jest.fn((command: Command) => {
                registeredCommands.push(command);
                return command;
            }),
            registerEvent: jest.fn(),
            registerInterval: jest.fn(() => 0)
        });

        await plugin.onload();
        
        // Set up test note
        testNote = app.vault.getFiles().find(f => f.path === 'note1.md') as TFile;
    });

    afterAll(async () => {
        // Clean up plugin
        if (plugin.onunload) {
            await plugin.onunload();
        }

        // Clean up any remaining timeouts
        jest.useRealTimers();
        
        // Wait for any remaining promises to settle
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should suggest tags for test note content', async () => {
        const content = await app.vault.adapter.read('note1.md');
        expect(content).toContain('tags: [test, sample]');
        
        // Verify that the command was registered
        const generateTagsCommand = registeredCommands.find(cmd => cmd.id === 'generate-note-tags');
        expect(generateTagsCommand).toBeDefined();
        expect(generateTagsCommand?.name).toBe('Generate Tags for Current Note');

        if (!generateTagsCommand?.editorCallback) {
            throw new Error('Generate tags command callback not found');
        }

        // Create mock editor and view
        const mockEditor = createMockEditor(content);
        const mockView = {
            file: testNote,
            editor: mockEditor
        } as MarkdownView;

        // Set up real Ollama instance
        (plugin as any).settings = {
            ollamaHost: 'http://localhost:11434',
            ollamaModel: 'llama3.1'
        };
        (plugin as any).initializeLangChain();

        // Call the command's callback which will use the real LLM
        await generateTagsCommand.editorCallback(mockEditor, mockView);

        // Since this is e2e, we'll need to wait for the real LLM response
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verify that new tags were added to the note
        const updatedContent = await app.vault.adapter.read('note1.md');
        expect(updatedContent).not.toBe(content); // Content should have changed
        expect(updatedContent.match(/tags:\s*\[(.*?)\]/)?.[1]).toBeDefined(); // Should have tags
    });

    test('should handle multiple files in vault', async () => {
        const fileList = await app.vault.adapter.list('');
        expect(fileList.files.length).toBeGreaterThan(0);
        expect(fileList.files.includes('note1.md')).toBe(true);
    });
});
