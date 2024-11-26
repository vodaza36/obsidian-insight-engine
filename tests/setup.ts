import { vi } from 'vitest';
import ObsidianMock from './__mocks__/obsidian';

// Mock the obsidian module with our implementation
vi.mock('obsidian', () => {
    return ObsidianMock;
});
