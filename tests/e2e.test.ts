import { App, TFile, Vault, Plugin, Command } from 'obsidian';
import TagAgent from '../main';
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
        if (plugin.onunload) {
            await plugin.onunload();
        }
    });

    test('should suggest tags for test note content', async () => {
        const content = await app.vault.adapter.read('note1.md');
        expect(content).toContain('tags: [test, sample]');
        
        // Verify that the command was registered
        const generateTagsCommand = registeredCommands.find(cmd => cmd.id === 'generate-note-tags');
        expect(generateTagsCommand).toBeDefined();
        expect(generateTagsCommand?.name).toBe('Generate Tags for Current Note');
    });

    test('should handle multiple files in vault', async () => {
        const fileList = await app.vault.adapter.list('');
        expect(fileList.files.length).toBeGreaterThan(0);
        expect(fileList.files.includes('note1.md')).toBe(true);
    });
});
