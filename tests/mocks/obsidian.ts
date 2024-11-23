// Mock the minimum required Obsidian types and interfaces for testing
export class Plugin {
    app: App;
    manifest: any;

    constructor(app: App, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }

    loadData() {
        return Promise.resolve({});
    }

    saveData(data: any) {
        return Promise.resolve();
    }

    loadSettings() {
        return Promise.resolve();
    }

    saveSettings() {
        return Promise.resolve();
    }
}

export class App {
    vault: Vault = new Vault();
}

export class Vault {
    async read(file: TFile): Promise<string> {
        return '';
    }

    async modify(file: TFile, data: string): Promise<void> {
        return;
    }
}

export interface TFile {
    path: string;
    name: string;
    vault: Vault;
    basename: string;
    extension: string;
    parent: any;
    stat: {
        ctime: number;
        mtime: number;
        size: number;
    };
}

export class PluginSettingTab {
    app: App;
    plugin: Plugin;

    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
    }

    display(): void {}
}

export class Setting {
    constructor(containerEl: HTMLElement) {}
    setName(name: string): this { return this; }
    setDesc(desc: string): this { return this; }
    addText(cb: (text: TextComponent) => any): this { return this; }
}

export class TextComponent {
    setValue(value: string): this { return this; }
    onChange(callback: (value: string) => any): this { return this; }
}

export class Modal {
    app: App;
    constructor(app: App) {
        this.app = app;
    }
    open() {}
    close() {}
}

export class Notice {
    constructor(message: string) {}
}
