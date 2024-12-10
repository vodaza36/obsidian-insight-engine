#!/usr/bin/env node

import { execSync } from 'child_process';
import { prepareRelease } from './prepare-release.mjs';
import path from 'path';
import fs from 'fs';

async function createGitHubRelease() {
    try {
        // 1. Prepare release files
        console.log('Preparing release files...');
        const zipFile = await prepareRelease();
        const releaseDir = path.dirname(zipFile);

        // 2. Get version from manifest.json
        const version = execSync('node -p "require(\'./manifest.json\').version"')
            .toString()
            .trim();

        // 3. Create GitHub release with assets
        console.log('Creating GitHub release...');
        
        // Create the release without assets first
        execSync(
            `gh release create ${version} ` +
            `--title "Insight Engine v${version}" ` +
            `--notes "# Insight Engine v${version}\n\n` +
            `First stable release of Insight Engine for Obsidian!\n\n` +
            `## Features\n\n` +
            `- AI-powered insights for your notes\n` +
            `- Intelligent tag generation\n` +
            `- Note summarization\n` +
            `- Question generation\n` +
            `- Privacy-focused local processing via Ollama\n\n` +
            `## Requirements\n\n` +
            `- Obsidian v1.4.0 or higher\n` +
            `- Desktop only\n\n` +
            `Visit https://hochbichler.com for more information.\n\n` +
            `Author: Thomas Hochbichler"`,
            { stdio: 'inherit' }
        );

        // Upload each file as a release asset
        const files = ['main.js', 'manifest.json', 'styles.css'];
        files.forEach(file => {
            const filePath = path.join(releaseDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`Uploading ${file} as release asset...`);
                execSync(
                    `gh release upload ${version} "${filePath}"`,
                    { stdio: 'inherit' }
                );
            }
        });

        console.log('Release created successfully!');
    } catch (error) {
        console.error('Error creating release:', error);
        process.exit(1);
    }
}

createGitHubRelease();
