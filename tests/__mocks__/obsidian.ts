import { vi } from 'vitest';

export class App {
	constructor() {}
}

export class PluginSettingTab {
	app: any;
	plugin: any;
	containerEl: any = { empty: vi.fn(), createEl: vi.fn() };

	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
}

export class Setting {
	constructor() {
		return {
			setName: vi.fn().mockReturnThis(),
			setDesc: vi.fn().mockReturnThis(),
			addDropdown: vi.fn().mockImplementation((cb) => {
				const dropdown = {
					setValue: vi.fn().mockReturnThis(),
					onChange: vi.fn(),
					addOption: vi.fn().mockReturnThis(),
				};
				cb(dropdown);
				return this;
			}),
			addText: vi.fn().mockReturnThis(),
		};
	}
}

export class DropdownComponent {
	constructor() {}
}

// Add any other Obsidian components you need to mock
