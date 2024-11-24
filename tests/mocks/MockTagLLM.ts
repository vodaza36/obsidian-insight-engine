import { BaseLLM } from "@langchain/core/language_models/llms";
import { Generation, GenerationChunk, LLMResult } from "@langchain/core/outputs";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";

/**
 * A mock LLM implementation for testing the tag generator
 * Using @langchain/core 0.3.18 API
 */
export class MockTagLLM extends BaseLLM {
    private mockTags: string[];

    constructor(mockTags: string[] = ["#mock-tag1", "#mock-tag2"]) {
        super({});
        this.mockTags = mockTags;
    }

    _llmType(): string {
        return "mock_tag_llm";
    }

    async *_streamResponseChunks(
        _prompt: string,
        _options: this["ParsedCallOptions"],
        runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<GenerationChunk> {
        // Demonstrate streaming capability in 0.3.18
        for (const tag of this.mockTags) {
            await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
            const chunk = new GenerationChunk({
                text: tag + ", ",
                generationInfo: {},
            });
            yield chunk;
            await runManager?.handleLLMNewToken(chunk.text);
        }
    }

    async _generate(
        prompts: string[],
        options: this["ParsedCallOptions"],
        runManager?: CallbackManagerForLLMRun
    ): Promise<LLMResult> {
        const generations: Generation[][] = [];

        for (const prompt of prompts) {
            // In 0.3.18, we use the new Generation type from @langchain/core/outputs
            const mockResponse = this.mockTags.join(", ");
            generations.push([
                {
                    text: mockResponse,
                    generationInfo: {
                        promptTokens: prompt.length,
                        completionTokens: mockResponse.length,
                        totalTokens: prompt.length + mockResponse.length,
                    },
                },
            ]);
        }

        return {
            generations,
            llmOutput: {
                tokenUsage: {
                    promptTokens: prompts.join("").length,
                    completionTokens: this.mockTags.join("").length,
                    totalTokens: prompts.join("").length + this.mockTags.join("").length,
                },
            },
        };
    }
}
