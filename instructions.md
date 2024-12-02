# Project Requirements Document
## Prupose
The pupose of this project is to develop an Obsidian plugin that handles the Tag management based
on an AI driven approach. Following requirements must be met: 

### Functional Requirements
- The plugin should be able to scan a single note and generate a list of tags. Thereby he should consider the list of existing tags. If no exiting tag fits then the plugin should suggest new tags.
- The plugin should be able to summarise a given note. The summary should be short and provide a brief overview of the note. Mardown should be supported to better format the summary. The use can copy the summary to its clipboard.
### Non-Functional Requirements
- The plugin should be available at the Obsidian marketplace.
- To keep everything private and secure an Ollama local LLM is used to classify the notes.
- The plugin should be easy to use and have a consistent look and feel with the Obsidian app
- The puglins repository should consider all best practices for plugin development suggested by https://github.com/obsidianmd/obsidian-sample-plugin
- Organize the code by features

## Features
- Scan the current note and generate a list of tags the will be suggested to the user

## UI
- On the plugin settings page the user must confirm to scan the vault for tags
- Using Obsidian's native UI components and APIs for:
    - Settings page implementation
    - Modals and notifications
    - Consistent look and feel with the Obsidian app
    - Command palette integration for scanning vault tags (accessible via Cmd/Ctrl + P)
- No external UI framework needed to maintain simplicity and reduce bundle size
- If the plugin is processing a user request, show a loading indicator and provide a cancel button to abort the operation

## Technology Stack
- [Obsidian](https://obsidian.md/) - Knowledge management application
- [TypeScript](https://www.typescriptlang.org/) - Programming language for type-safe JavaScript
- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Native UI components and plugin APIs
- [LangChain.js](https://js.langchain.com/) - Framework for developing LLM-powered applications
- [Ollama](https://github.com/ollama/ollama) - Run large language models locally
    - Using "llama3.1" as the base model for text generation and analysis

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
