import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Read both files
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const manifestJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));

// Update manifest with package.json values
manifestJson.version = packageJson.version;
manifestJson.description = packageJson.description;
manifestJson.keywords = packageJson.keywords || [];

// Save the updated manifest
fs.writeFileSync(
    path.join(rootDir, 'manifest.json'),
    JSON.stringify(manifestJson, null, '\t') + '\n'
);

// Also update package.json keywords from manifest if they exist there but not in package.json
if (manifestJson.keywords && (!packageJson.keywords || packageJson.keywords.length === 0)) {
    packageJson.keywords = manifestJson.keywords;
    fs.writeFileSync(
        path.join(rootDir, 'package.json'),
        JSON.stringify(packageJson, null, 2) + '\n'
    );
}

console.log('✅ Successfully synced metadata from package.json to manifest.json');
