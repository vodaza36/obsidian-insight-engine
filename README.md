# Obsidian Insight Engine Plugin

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/username/obsidian-insight-engine)](https://github.com/username/obsidian-insight-engine/releases)
[![License](https://img.shields.io/github/license/username/obsidian-insight-engine)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/username/obsidian-insight-engine/total)](https://github.com/username/obsidian-insight-engine/releases)

Transform your Obsidian vault with AI-powered insights while keeping your privacy intact. The Insight Engine plugin enhances your note-taking experience by combining the power of advanced AI with the flexibility to choose between cloud-based (OpenAI) or privacy-focused local (Ollama) processing.

## ✨ Key Features

### 🤖 Intelligent Tag Generation
- Automatically generates contextually relevant tags based on note content
- Understands relationships between notes for smarter tagging
- Suggests tags that reflect both explicit and implicit themes in your content

### 🔒 Privacy-First Architecture
- Choose between OpenAI (cloud) or Ollama (local) for AI processing
- Keep sensitive notes private with local processing
- Full control over your data and AI model selection

### 🎯 Coming Soon
- AI-powered semantic search across your vault
- Natural language querying for intuitive note discovery
- Enhanced context understanding for more accurate results

## 🚀 Installation

### Community Plugin Store (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Insight Engine"
4. Install the plugin and enable it

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/username/obsidian-insight-engine/releases)
2. Extract the ZIP file into your vault's `.obsidian/plugins` folder
3. Reload Obsidian
4. Enable the plugin in Community Plugins settings

## ⚙️ Setup

### OpenAI Setup
1. Get your API key from [OpenAI](https://platform.openai.com/)
2. Open Settings → Insight Engine
3. Select OpenAI as the LLM Provider
4. Paste your API key
5. Choose your preferred model (default: gpt-3.5-turbo)

### Ollama Setup (Privacy-Focused Option)
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull your preferred model: `ollama pull llama2`
3. Start Ollama
4. In plugin settings:
   - Select Ollama as LLM Provider
   - Set Host URL (default: http://localhost:11434)
   - Choose your model (default: llama2)

## 📖 Usage

### Basic Commands
- `Cmd/Ctrl + P` → "Generate Tags" to analyze current note
- Configure tag style and location in settings
- Tags can be added as YAML frontmatter or inline

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Setup Development Environment
1. Clone the repository
```bash
git clone https://github.com/username/obsidian-insight-engine.git
cd obsidian-insight-engine
```

2. Install dependencies
```bash
npm install
```

3. Build for development
```bash
npm run dev
```

4. For production build
```bash
npm run build
```

### Testing
- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- E2E tests: `npm run test:e2e`

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
