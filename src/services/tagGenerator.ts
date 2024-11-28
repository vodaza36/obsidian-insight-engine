/**
 * Obsidian Insight Engine Plugin
 * Copyright (c) 2024 Thomas Hochbichler
 * MIT License
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * TagGenerator class is responsible for generating contextually relevant tags for notes
 * using various LLM providers (OpenAI or Ollama). It analyzes note content and suggests
 * tags that capture the main topics and concepts while following configurable formatting rules.
 * 
 * @example
 * ```typescript
 * const model = LLMFactory.createModel(LLMProvider.OLLAMA, 'llama2');
 * const generator = new TagGenerator(model, 'kebab-case');
 * const tags = await generator.generateTags('My note content', ['existing-tag']);
 * ```
 */
export class TagGenerator {
    private model: BaseChatModel;
    private promptTemplate: PromptTemplate;
    private outputParser: StringOutputParser;
    private tagStyle: string;

    /**
     * Creates a new TagGenerator instance
     * @param model - The LLM model to use for tag generation (OpenAI or Ollama)
     * @param tagStyle - The formatting style for generated tags (default: 'kebab-case')
     */
    constructor(model: BaseChatModel, tagStyle: string = 'kebab-case') {
        this.model = model;
        this.tagStyle = tagStyle;

        // Initialize prompt template with tag generation rules and formatting guidelines
        this.promptTemplate = new PromptTemplate({
            template: `You are a tag suggestion system. Analyze the following content and suggest relevant tags for organizing it.
            Focus on the main topics, concepts, and categories that would help in finding this content later.

Content to analyze:
{text}

Existing tags:
{existingTags}

Rules for tag suggestions:
1. Format all tags in {tagStyle} style (e.g., if "meeting notes" is a tag: 
   - camelCase → "meetingNotes"
   - PascalCase → "MeetingNotes"
   - snake_case → "meeting_notes"
   - kebab-case → "meeting-notes"
   - Train-Case → "Meeting-Notes"
   - UPPERCASE → "MEETINGNOTES"
   - lowercase → "meetingnotes")
2. Prefer the noun form instead of gerund verbs (e.g., 'develop' instead of 'developing')
3. Provide at least 2 tags and at most 5 relevant tags
4. Use acronym format (e.g., 'ai' instead of 'Artificial Intelligence', or 'rag' instead of 'retrieval-augmented generation')
5. Use singular form instead of plural tags (e.g., 'hobby' instead of 'hobbies')
6. Prefer single-word tags (e.g., 'ai' instead of 'artificial-intelligence')
7. For multi-word tags, use the specified tag style format
8. In case of a multi-word tag, think about if you can replace it with a popular acronym (e.g., 'artificial-intelligence' -> 'ai')
9. Focus on content-specific tags, avoid generic tags (e.g., 'hobby' instead of 'interest')
10. Tags should be specific enough to be useful but general enough to be reusable

IMPORTANT: Return ONLY the tags as a comma-separated list without any additional text or explanation.
Example output format: tag1, tag2, tag3`,
            inputVariables: ['text', 'existingTags', 'tagStyle']
        });

        this.outputParser = new StringOutputParser();
    }

    /**
     * Generates tags for the given note content while considering existing tags
     * @param content - The note content to analyze
     * @param existingTags - Array of tags that already exist in the note (optional)
     * @returns Promise<string[]> Array of generated tags in the specified format
     * @throws Error if the LLM fails to generate tags or returns invalid format
     */
    async suggestTags(content: string, existingTags: Set<string> = new Set()): Promise<string[]> {
        try {
            const existingTagsString = Array.from(existingTags)
                .map(tag => tag.replace('#', ''))
                .join(', ') || 'None';
            
            const prompt = await this.promptTemplate.format({ 
                text: content,
                existingTags: existingTagsString,
                tagStyle: this.tagStyle
            });
            
            const chain = this.model.pipe(this.outputParser);
            const response = await chain.invoke(prompt);
            
            return response
                .split(',')
                .map(tag => "#" + tag.trim())
                .filter(tag => tag.length > 0);
        } catch (error) {
            console.error('Error suggesting tags:', error);
            if (error instanceof Error && 
                (error.message.includes('ECONNREFUSED') || 
                 error.message.includes('Failed to fetch'))) {
                throw new Error('Unable to connect to Ollama server. Please make sure it is running and accessible.');
            }
            throw error;
        }
    }
}
