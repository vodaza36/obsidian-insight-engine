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

export interface Editor {
    getValue(): string;
    setValue(value: string): void;
    getDoc(): any;
    refresh(): void;
    getLine(line: number): string;
    setLine(n: number, text: string): void;
    lineCount(): number;
    lastLine(): number;
    getRange(from: any, to: any): string;
    replaceRange(replacement: string, from: any, to?: any): void;
    getSelection(): string;
    somethingSelected(): boolean;
    getSelections(): string[];
    replaceSelection(replacement: string): void;
    replaceSelections(replacements: string[]): void;
    getCursor(string?: string): any;
    listSelections(): any[];
    setCursor(pos: number): void;
    setSelection(anchor: any, head?: any): void;
    setSelections(ranges: any[], main?: number): void;
    focus(): void;
    blur(): void;
    hasFocus(): boolean;
    getScrollInfo(): any;
    scrollTo(x?: number | null, y?: number | null): void;
    scrollIntoView(range: any, margin?: number): void;
    undo(): void;
    redo(): void;
    exec(command: string): void;
    transaction(tx: () => void): void;
    posToOffset(pos: any): number;
    offsetToPos(offset: number): any;
    processLines(from: number, to: number, fn: (line: string, lineNo: number) => void): void;
    wordAt(pos: any): any | null;
}

export interface MarkdownView {
    file: TFile;
    editor: Editor;
}
