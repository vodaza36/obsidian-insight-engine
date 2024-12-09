# Project Requirements Document

## Purpose

The purpose of this project is to develop an Obsidian plugin that handles the Tag management based
on an AI driven approach. Following requirements must be met:

### Functional Requirements

- The plugin should be able to scan a single note and generate a list of tags. Thereby it should consider the list of existing tags. If no existing tag fits then the plugin should suggest new tags.
- The plugin should be able to summarise a given note. The summary should be short and provide a brief overview of the note. Markdown should be supported to better format the summary. The user can copy the summary to its clipboard.
- The plugin should generate questions derived from a given note. The questions should be short and provide a brief overview of the note. Markdown should be supported to better format the questions. The user can copy the questions to its clipboard.

### Non-Functional Requirements

- The plugin should be available at the Obsidian marketplace.
- To keep everything private and secure an Ollama local LLM is used to classify the notes.
- The plugin should be easy to use and have a consistent look and feel with the Obsidian app
- The plugin's repository should consider all best practices for plugin development suggested by https://github.com/obsidianmd/obsidian-sample-plugin
- Organize the code by features

## Features

- Scan the current note and generate a list of tags that will be suggested to the user

## UI

- On the plugin settings page the user must confirm to scan the vault for tags
- Using Obsidian's native UI components and APIs for:
    - Settings page implementation
    - Modals and notifications
    - Consistent look and feel with the Obsidian app
    - Command palette integration for scanning vault tags (accessible via Cmd/Ctrl + P)
- No external UI framework needed to maintain simplicity and reduce bundle size
- If the plugin is processing a user request, show a loading indicator and provide a cancel button to abort the operation

## Project Structure

The project follows a feature-based organization with a dedicated test folder:

```
obsidian-insight-engine/
├── src/               # Source code
│   ├── features/     # Feature-based modules
│   ├── ui/          # UI components
│   └── ...
├── tests/            # Test files
│   ├── unit/        # Unit tests
│   │   ├── ui/     # UI component tests (modals, settings, etc.)
│   │   ├── services/# Service tests
│   │   └── ...
│   ├── e2e/         # End-to-end tests
│   └── ...
└── ...
```

All UI-related tests should be placed in the `tests/unit/ui/` directory, following these naming conventions:

- Modal tests: `*Modal.test.ts`
- Settings tests: `*Settings.test.ts`
- Other UI component tests: `*Component.test.ts`

## Technology Stack

- [Obsidian](https://obsidian.md/) - Knowledge management application
- [TypeScript](https://www.typescriptlang.org/) - Programming language for type-safe JavaScript
- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Native UI components and plugin APIs
- [LangChain.js](https://js.langchain.com/) - Framework for developing LLM-powered applications
- [Ollama](https://github.com/ollama/ollama) - Run large language models locally
    - Using "llama3.1" as the base model for text generation and analysis

## Testing Guidelines

### Test Organization

Tests are organized in a dedicated `tests` directory with separate folders for unit and end-to-end tests. Each test file should follow the pattern `*.test.ts`.

### ⚠️ Important: Focus on Behavior Testing

When writing tests, always focus on testing behavior and public APIs rather than implementation details. This makes tests more maintainable and resilient to changes. Here's how:

1. **DO Test**:

    - User-visible behavior
    - Public method inputs and outputs
    - Component interactions
    - UI state changes
    - Event handling

2. **DON'T Test**:
    - Private methods
    - Internal state
    - Implementation details
    - Private class properties

Example of behavior-focused testing:

```typescript
// ❌ Bad: Testing implementation details
it('should set private properties', () => {
	expect(modal['_summary']).toBe(summary);
	expect(modal['_isOpen']).toBe(true);
});

// ✅ Good: Testing behavior
it('should display summary content when opened', async () => {
	await modal.onOpen();
	const content = modal.contentEl.querySelector('.summary-content');
	expect(content?.textContent).toContain(summary);
});
```

### Testing Approach

We follow a Behavior-Driven Development (BDD) approach using Vitest as our testing framework. Each test suite should:

1. Use descriptive BDD-style naming:

    ```typescript
    describe('TagGenerator', () => {
    	describe('when analyzing a note', () => {
    		it('should generate relevant tags based on content', () => {
    			// test implementation
    		});
    	});
    });
    ```

2. Follow the Given-When-Then pattern in test comments:

    ```typescript
    describe('NoteAnalyzer', () => {
    	it('should summarize note content', () => {
    		// Given: a note with specific content
    		const note = createNote('Sample content');

    		// When: the analyzer processes the note
    		const summary = analyzer.summarize(note);

    		// Then: it should return a concise summary
    		expect(summary).toContain('key points');
    	});
    });
    ```

3. Test Organization Rules:

    - Unit tests (`/tests/unit/`): Test individual components in isolation
    - E2E tests (`/tests/e2e/`): Test complete features from user perspective
    - Group related tests in feature-specific files
    - Mock external dependencies (LLM, file system) in unit tests
    - Use real dependencies in E2E tests when possible

4. Test Coverage Requirements:
    - Maintain high test coverage for core functionality
    - Critical paths must have both unit and E2E tests
    - Edge cases should be covered in unit tests
    - UI interactions should be covered in E2E tests

### UI Testing Best Practices

When testing Obsidian UI components (modals, settings tabs, etc.), follow these guidelines:

1. Mock Obsidian Components:

    ```typescript
    vi.mock('obsidian', () => {
    	return {
    		App: vi.fn(),
    		Modal: vi.fn().mockImplementation(function (this: any, app: App) {
    			this.contentEl = {
    				empty: vi.fn(),
    				createEl: vi.fn().mockReturnValue({
    					style: {},
    					attr: {},
    					text: '',
    				}),
    				style: {},
    				innerHTML: '',
    			};
    			this.app = app;
    		}),
    	};
    });
    ```

2. Set Up Test Fixtures:

    ```typescript
    describe('YourModal', () => {
    	let app: App;
    	let modal: YourModal;

    	beforeEach(() => {
    		app = new App();
    		modal = new YourModal(app);
    	});
    });
    ```

3. Test UI Element Creation:

    - Verify elements are created with correct attributes
    - Check element hierarchy and nesting
    - Validate text content and styles

    ```typescript
    it('should create UI elements correctly', () => {
    	modal.onOpen();
    	expect(modal.contentEl.createEl).toHaveBeenCalledWith('h3', {
    		text: 'Expected Text',
    		attr: expect.objectContaining({
    			style: expect.stringContaining('margin: 0 0 10px 0'),
    		}),
    	});
    });
    ```

4. Test UI Interactions:

    - Mock user interactions (clicks, input)
    - Verify state changes after interactions
    - Test modal open/close behavior
    - Validate event handlers

5. Best Practices:

    - Keep tests simple and focused
    - Use meaningful test descriptions
    - Clean up after each test
    - Use appropriate assertions

6. Testing Library Approach:

    - Instead of manually creating complex Vi Mocks, leverage testing-library's approach
    - Use @testing-library/dom to create lightweight, semantic mocks
    - Focus on behavior rather than implementation details
    - Test components as users would interact with them

7. Dependency Injection Pattern:

    - Restructure code to use dependency injection
    - Makes it easier to swap real Obsidian UI components with test doubles
    - Creates simpler, more predictable mocks
    - Improves testability and maintainability

8. Common Test Scenarios:
    - Modal opening and closing
    - Element creation and attributes
    - User input handling
    - Error message display
    - Loading states
    - Async operation feedback
    - Clipboard operations
    - Settings persistence

Remember to clean up mocks between tests using `beforeEach()` and test both happy paths and edge cases.

# Documentation and Examples

## How to use LangChain.js with Ollama

```ts
// Install the LangChain v3.0 core node package
npm install @langchain/core
// Install the Ollama chat model v.0.1.2
npm install @langchain/ollama
// instantiate our model object and generate chat completions
import { Ollama } from "@langchain/ollama";

const llm = new Ollama({
  model: "llama3", // Default value
  temperature: 0,
  maxRetries: 2,
  // other params...
});
// invoke the LLM
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const messages = [
  new SystemMessage("Translate the following from English into Italian"),
  new HumanMessage("hi!"),
];

await model.invoke(messages);
// use an Output parser
import { StringOutputParser } from "@langchain/core/output_parsers";

const parser = new StringOutputParser();
// LCEL syntax
const chain = model.pipe(parser);
await chain.invoke(messages);
// use a PromptTemplate
import { ChatPromptTemplate } from "@langchain/core/prompts";
const systemTemplate = "Translate the following into {language}:";
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);
const promptValue = await promptTemplate.invoke({
  language: "italian",
  text: "hi",
});

promptValue;
promptValue.toChatMessages();
const llmChain = promptTemplate.pipe(model).pipe(parser);
await llmChain.invoke({ language: "italian", text: "hi" });
```

# Roadmap

- Add the plugin to the Obsidian marketplace
- Add cost estimation
