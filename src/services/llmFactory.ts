import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';

export enum LLMProvider {
    OPENAI = 'openai',
    OLLAMA = 'ollama'
}

export class LLMFactory {
    static createModel(provider: LLMProvider, modelName: string, options: Record<string, any> = {}): BaseChatModel {
        switch (provider) {
            case LLMProvider.OPENAI:
                return new ChatOpenAI({
                    modelName,
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
