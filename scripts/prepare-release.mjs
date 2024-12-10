#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure we're in the project root
const projectRoot = process.cwd();

async function prepareRelease() {
    try {
        // 1. Build the project (skip tests for release build)
        console.log('Building project...');
        execSync('node esbuild.config.mjs production', { stdio: 'inherit' });

        // 2. Create release directory if it doesn't exist
        const releaseDir = path.join(projectRoot, 'release');
        if (!fs.existsSync(releaseDir)) {
            fs.mkdirSync(releaseDir);
        }

        // 3. Copy required files
        const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];
        console.log('Copying release files...');
        
        filesToCopy.forEach(file => {
            if (fs.existsSync(path.join(projectRoot, file))) {
                fs.copyFileSync(
                    path.join(projectRoot, file),
                    path.join(releaseDir, file)
                );
                console.log(`Copied ${file}`);
            } else {
                console.warn(`Warning: ${file} not found`);
            }
        });

        // 4. Create zip file
        const { version } = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        const zipFileName = `insight-engine-${version}.zip`;
        
        console.log('Creating zip file...');
        execSync(`cd "${releaseDir}" && zip -r "${zipFileName}" ./*`, { stdio: 'inherit' });

        console.log(`Release files prepared in release/${zipFileName}`);
        
        return path.join(releaseDir, zipFileName);
    } catch (error) {
        console.error('Error preparing release:', error);
        process.exit(1);
    }
}

// If running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    prepareRelease();
}

export { prepareRelease };
