/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';

export enum LLMProvider {
    OPENAI = 'openai',
    OLLAMA = 'ollama'
}

export class LLMFactory {
    static validateConfig(provider: LLMProvider, settings: Record<string, any>): string | null {
        switch (provider) {
            case LLMProvider.OPENAI:
                if (!settings.apiKey) {
                    return 'OpenAI API key is required. Please configure it in the settings.';
                }
                break;
            case LLMProvider.OLLAMA:
                if (!settings.llmHost) {
                    return 'Ollama host URL is required. Please configure it in the settings.';
                }
                break;
        }
        return null;
    }

    static createModel(provider: LLMProvider, modelName: string, options: Record<string, any> = {}): BaseChatModel {
        const validationError = this.validateConfig(provider, options);
        if (validationError) {
            throw new Error(validationError);
        }

        switch (provider) {
            case LLMProvider.OPENAI:
                return new ChatOpenAI({
                    modelName,
                    openAIApiKey: options.apiKey,
                    ...options
                });
            case LLMProvider.OLLAMA:
                return new ChatOllama({
                    model: modelName,
                    ...options
                });
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }
}
