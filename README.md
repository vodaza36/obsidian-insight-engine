# Obsidian Tag Agent

An AI-powered Obsidian plugin that helps manage and suggest tags for your notes using LangChain.js and OpenAI.

## Resources
The following list of resources were used to develop this plugin:
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

## Features

- Automatically analyzes note content and suggests relevant tags
- Uses OpenAI's language models through LangChain.js
- Simple settings interface for API key management

## Installation

1. Download the latest release from the releases page
2. Extract the files to your Obsidian plugins folder: `.obsidian/plugins/obsidian-tag-agent/`
3. Enable the plugin in Obsidian's settings
4. Add your OpenAI API key in the plugin settings

## Usage

1. Open any note you want to analyze
2. Use the command palette (Cmd/Ctrl + P) and search for "Analyze Current Note"
3. The plugin will analyze your note content and suggest relevant tags

## Project Structure

| File/Directory | Purpose |
|---------------|---------|
| `.github/workflows/` | Contains GitHub Actions workflows for automated releases and CI/CD. |
| `.vscode/` | VS Code editor configuration for consistent development settings. |
| `node_modules/` | Contains project dependencies installed via npm (not tracked in git). |
| `.editorconfig` | Defines coding style rules for editors (indentation, line endings, etc.). |
| `.eslintignore` | Specifies which files and directories should be ignored by ESLint. |
| `.eslintrc.json` | Configuration file for ESLint, defining code style and quality rules. |
| `.gitignore` | Specifies which files Git should ignore when tracking changes. |
| `.npmrc` | npm configuration file for package management settings. |
| `.prettierrc` | Configuration file for Prettier code formatter with project-specific rules. |
| `.prettierignore` | Specifies which files should be ignored by Prettier formatting. |
| `esbuild.config.mjs` | Configuration for esbuild, the project's bundler. |
| `instructions.md` | Project requirements and technical documentation. |
| `LICENSE` | MIT license file defining how the code can be used by others. |
| `main.ts` | Main plugin file containing the core functionality. |
| `manifest.json` | Plugin metadata and configuration for Obsidian. |
| `package.json` | Project dependencies and scripts configuration. |
| `package-lock.json` | Locked versions of npm dependencies for consistent installs. |
| `README.md` | Project documentation and usage instructions. |
| `styles.css` | Custom CSS styles for the plugin's UI elements. |
| `tsconfig.json` | TypeScript compiler configuration. |
| `versions.json` | Tracks minimum Obsidian version requirements for each plugin version. |

## Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. For development with hot reload:
   ```bash
   npm run dev
   ```

## Testing

The plugin uses Jest for testing and includes both integration and end-to-end (e2e) tests.

### Test Types

1. **Integration Tests**
   - Located in `tests/integration/`
   - Test individual components and their interactions
   - Do not require external services
   - Verify core functionality with mocked LLM responses

2. **End-to-End Tests**
   - Located in `tests/e2e/`
   - Test complete user workflows
   - Require Ollama to be running (`ollama serve`)
   - Use real LLM calls for tag generation
   - Validate the entire tag suggestion pipeline

### Running Tests

```bash
# Run all tests
npm test

# Run only integration tests
npm run test:integration

# Run only e2e tests (requires Ollama running)
npm run test:e2e

# Watch mode
npm run test:watch              # Watch all tests
npm run test:integration:watch  # Watch integration tests
npm run test:e2e:watch         # Watch e2e tests
```

### Prerequisites for E2E Testing

1. Make sure Ollama is installed and the desired model is pulled:
   ```bash
   ollama pull llama3.1
   ```

2. Start the Ollama server:
   ```bash
   ollama serve
   ```

The e2e tests will automatically check if Ollama is running before execution. If Ollama is not running, the tests will fail with a clear error message.

### Test Coverage

The test suite aims to provide comprehensive coverage of:
- Plugin initialization and command registration
- Tag suggestion functionality
- LLM integration (both mocked and real)
- File system operations
- User interface interactions
- Error handling and edge cases

## Requirements

- Obsidian v0.15.0 or higher
- OpenAI API key
