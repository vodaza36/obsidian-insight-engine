import fs from 'fs';
import path from 'path';

function generateCoverageBadge() {
    try {
        // Read the coverage summary
        const coveragePath = path.resolve('./coverage/coverage-summary.json');
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        
        // Calculate total coverage
        const totalCoverage = coverage.total.statements.pct;
        
        // Determine badge color based on coverage percentage
        let color = 'red';
        if (totalCoverage >= 90) {
            color = 'brightgreen';
        } else if (totalCoverage >= 70) {
            color = 'yellow';
        } else if (totalCoverage >= 50) {
            color = 'orange';
        }

        // Create badge URL
        const badgeUrl = `https://img.shields.io/badge/coverage-${totalCoverage}%25-${color}`;
        
        // Read README content
        const readmePath = path.resolve('./README.md');
        let readmeContent = fs.readFileSync(readmePath, 'utf8');
        
        // Replace existing coverage badge or add new one
        const badgeRegex = /\[\!\[Test Coverage\]\(.*?\)\]\(.*?\)/;
        const newBadge = `[![Test Coverage](${badgeUrl})](./coverage/index.html)`;
        
        if (readmeContent.match(badgeRegex)) {
            readmeContent = readmeContent.replace(badgeRegex, newBadge);
        } else {
            // Add after the last badge
            const lastBadgeIndex = readmeContent.lastIndexOf('[![');
            const endOfBadgeLine = readmeContent.indexOf('\n', lastBadgeIndex) + 1;
            readmeContent = 
                readmeContent.slice(0, endOfBadgeLine) + 
                newBadge + '\n' + 
                readmeContent.slice(endOfBadgeLine);
        }
        
        // Write updated README
        fs.writeFileSync(readmePath, readmeContent);
        console.log(`Coverage badge updated: ${totalCoverage}%`);
        
    } catch (error) {
        console.error('Error generating coverage badge:', error);
        process.exit(1);
    }
}

generateCoverageBadge();
