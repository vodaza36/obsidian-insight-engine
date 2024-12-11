import { vi } from 'vitest';

// Mock browser globals
Object.defineProperty(global, 'navigator', {
	value: {
		clipboard: {
			writeText: vi.fn(),
		},
	},
	writable: true,
});
