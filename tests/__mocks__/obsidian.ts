// Mock implementations of Obsidian types and classes
export class App {
    vault: {
        read: (file: TFile) => Promise<string>;
        modify: (file: TFile, content: string) => Promise<void>;
    };

    constructor() {
        this.vault = {
            read: async () => "",
            modify: async () => {},
        };
    }
}

export class Plugin {
    app: App;
    manifest: any;

    constructor(app: App, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }
}

export class TFile {
    path: string;
    name: string;
    
    constructor(path: string, name: string) {
        this.path = path;
        this.name = name;
    }
}

export interface PluginManifest {
    id: string;
    name: string;
    version?: string;
    minAppVersion?: string;
    description?: string;
    author?: string;
    authorUrl?: string;
    isDesktopOnly?: boolean;
}

// Default export to match Obsidian's module structure
export default {
    App,
    Plugin,
    TFile
};
