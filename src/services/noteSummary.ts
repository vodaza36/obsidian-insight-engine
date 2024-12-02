import { Notice } from 'obsidian';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export interface SummaryResult {
    summary: string;
    error?: string;
}

/**
 * NoteSummaryService class is responsible for generating concise summaries of notes
 * using LLM models. It processes note content and returns a summarized version while
 * maintaining the key points and main ideas.
 * 
 * @example
 * ```typescript
 * const model = LLMFactory.createModel(LLMProvider.OLLAMA, 'llama3');
 * const service = new NoteSummaryService(model);
 * const result = await service.generateSummary('Note content to summarize');
 * ```
 */
export class NoteSummaryService {
    private isProcessing: boolean = false;
    private model: BaseChatModel;
    private summarizeChain: any;

    /**
     * Creates a new NoteSummaryService instance
     * @param model - The LLM model to use for summary generation
     */
    constructor(model: BaseChatModel) {
        this.model = model;
        this.initializeSummarizeChain();
    }

    private initializeSummarizeChain() {
        const systemTemplate = "You are a summarization assistant. Your task is to create concise summaries. IMPORTANT: Respond ONLY with the summary itself - do not add any introductory phrases like 'Here's a summary' or 'Here's what I found'. The summary should be direct and start with the main points.";
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", systemTemplate],
            ["user", "{text}"],
        ]);
    
        const parser = new StringOutputParser();
        this.summarizeChain = promptTemplate.pipe(this.model).pipe(parser);
    }
    
    /**
     * Generates a summary of the provided note content
     * @param noteContent The content of the note to summarize
     * @returns Promise<SummaryResult> containing the summary or error
     */
    async generateSummary(noteContent: string): Promise<SummaryResult> {
        if (this.isProcessing) {
            return {
                summary: '',
                error: 'Another summary is currently being processed'
            };
        }

        try {
            this.isProcessing = true;
            
            const summary = await this.summarizeChain.invoke({
                text: noteContent
            });

            return {
                summary
            };
        } catch (error) {
            console.error('Error generating summary:', error);
            return {
                summary: '',
                error: 'Failed to generate summary: ' + error.message
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Copies the provided text to clipboard
     * @param text The text to copy
     * @returns Promise<boolean> indicating success
     */
    async copyToClipboard(text: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(text);
            new Notice('Summary copied to clipboard');
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            new Notice('Failed to copy to clipboard');
            return false;
        }
    }
}
